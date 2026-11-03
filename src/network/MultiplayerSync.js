// Real-Time Multiplayer Synchronization Engine for Online LP Bar (MIDNIGHT GROOVE)
// Combines:
// 1. Global WSS MQTT Pub/Sub Relay (Zero-dependency MQTT v3.1.1 over WebSocket with multi-broker failover)
// 2. Local Dev Server WebSocket Relay (/ws-lpbar when running via Vite dev server)
// 3. Browser BroadcastChannel (Instant sub-millisecond sync across local tabs/windows)

const PUBLIC_MQTT_BROKERS = [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://broker.hivemq.com:8884/mqtt',
  'wss://test.mosquitto.org:8081'
];

const ROOM_TOPIC = 'onlinelpbar/midnight-groove/v1/room/main';
const BROADCAST_CHANNEL_NAME = 'onlinelpbar_midnight_groove_v1';
const PEER_TIMEOUT_MS = 14000;
const HEARTBEAT_INTERVAL_MS = 2500;

const RANDOM_NICK_PREFIXES = ['새벽의', '자정의', '위스키', '아날로그', '재즈빛', '센티멘탈', '미드나잇', '온더락', '바이닐', '달빛'];
const RANDOM_NICK_NOUNS = ['디거', '리스너', '바텐더', '피아니스트', '산책자', '몽상가', '수집가', '여행자', '시인', '그루브'];

export function generateRandomNickname() {
  const p = RANDOM_NICK_PREFIXES[Math.floor(Math.random() * RANDOM_NICK_PREFIXES.length)];
  const n = RANDOM_NICK_NOUNS[Math.floor(Math.random() * RANDOM_NICK_NOUNS.length)];
  const num = Math.floor(10 + Math.random() * 89);
  return `${p} ${n}${num}`;
}

// Minimal MQTT v3.1.1 Binary Packet Helpers for WebSocket ('mqtt' subprotocol)
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function encodeMQTTString(str) {
  const bytes = textEncoder.encode(str);
  const out = new Uint8Array(2 + bytes.length);
  out[0] = (bytes.length >> 8) & 0xff;
  out[1] = bytes.length & 0xff;
  out.set(bytes, 2);
  return out;
}

function encodeMQTTVarLength(len) {
  const bytes = [];
  do {
    let digit = len % 128;
    len = Math.floor(len / 128);
    if (len > 0) digit |= 128;
    bytes.push(digit);
  } while (len > 0);
  return new Uint8Array(bytes);
}

function concatUint8Arrays(...arrays) {
  const totalLen = arrays.reduce((acc, a) => acc + a.length, 0);
  const res = new Uint8Array(totalLen);
  let offset = 0;
  for (const a of arrays) {
    res.set(a, offset);
    offset += a.length;
  }
  return res;
}

function buildMQTTConnectPacket(clientId) {
  const protocolName = encodeMQTTString('MQTT');
  // Protocol Level 4 (v3.1.1), Clean Session (0x02), Keep Alive 30s (0x00, 0x1e)
  const fixedPayloadHeader = new Uint8Array([0x04, 0x02, 0x00, 0x1e]);
  const clientIdBytes = encodeMQTTString(clientId);
  const body = concatUint8Arrays(protocolName, fixedPayloadHeader, clientIdBytes);
  return concatUint8Arrays(new Uint8Array([0x10]), encodeMQTTVarLength(body.length), body);
}

function buildMQTTSubscribePacket(topic, packetId = 1) {
  const pid = new Uint8Array([(packetId >> 8) & 0xff, packetId & 0xff]);
  const topicBytes = encodeMQTTString(topic);
  const qos = new Uint8Array([0x00]);
  const body = concatUint8Arrays(pid, topicBytes, qos);
  return concatUint8Arrays(new Uint8Array([0x82]), encodeMQTTVarLength(body.length), body);
}

function buildMQTTPublishPacket(topic, jsonString) {
  const topicBytes = encodeMQTTString(topic);
  const msgBytes = textEncoder.encode(jsonString);
  const body = concatUint8Arrays(topicBytes, msgBytes);
  return concatUint8Arrays(new Uint8Array([0x30]), encodeMQTTVarLength(body.length), body);
}

function buildMQTTPingReqPacket() {
  return new Uint8Array([0xc0, 0x00]);
}

export class MultiplayerSync {
  constructor(callbacks = {}) {
    this.callbacks = callbacks;
    this.peerId = 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
    this.joinedAt = Date.now();

    // Remote peers map: peerId -> peerState
    this.peers = new Map();
    // Deduplication set of recent message IDs
    this.seenMsgIds = new Set();

    // Local player state snapshot
    this.localState = {
      peerId: this.peerId,
      nickname: localStorage.getItem('onlinelpbar_nickname') || generateRandomNickname(),
      gender: 'male',
      x: 0,
      z: 6.2,
      rotY: Math.PI,
      isMoving: false,
      isSeated: false,
      seatedTableId: null,
      seatIndex: 0,
      heldLP: null,
      chatText: '',
      chatExpiresAt: 0
    };

    // Transports
    this.bc = null;
    this.localWs = null;
    this.mqttWs = null;
    this.mqttConnected = false;
    this.brokerIndex = 0;
    this.mqttPingTimer = null;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.cleanupTimer = null;
    this.lastMoveSentAt = 0;
  }

  init(initialProfile = {}) {
    if (initialProfile.nickname) {
      this.localState.nickname = initialProfile.nickname;
    }
    if (initialProfile.gender) {
      this.localState.gender = initialProfile.gender;
    }

    this._initBroadcastChannel();
    this._connectMQTTBroker(0);

    // Periodic heartbeat & peer cleanup
    this.heartbeatTimer = setInterval(() => {
      this.broadcastPresence();
    }, HEARTBEAT_INTERVAL_MS);

    this.cleanupTimer = setInterval(() => {
      this._pruneStalePeers();
    }, 3000);

    window.addEventListener('beforeunload', () => {
      this._sendPacket('peer-leave', { peerId: this.peerId });
    });

    // Initial hello + state request
    setTimeout(() => {
      this.broadcastPresence();
      this._sendPacket('state-request', { requesterId: this.peerId });
    }, 350);
  }

  setNickname(nickname) {
    const clean = (nickname || '').trim().slice(0, 18) || generateRandomNickname();
    this.localState.nickname = clean;
    try {
      localStorage.setItem('onlinelpbar_nickname', clean);
    } catch {
      // ignore
    }
    this.broadcastPresence();
    return clean;
  }

  setGender(gender) {
    this.localState.gender = gender === 'female' ? 'female' : 'male';
    this.broadcastPresence();
  }

  updateLocalTransform({ x, z, rotY, isMoving, isSeated, seatedTableId, seatIndex, heldLP }, forceImmediate = false) {
    this.localState.x = Number(x.toFixed(3));
    this.localState.z = Number(z.toFixed(3));
    this.localState.rotY = Number(rotY.toFixed(3));
    this.localState.isMoving = Boolean(isMoving);
    this.localState.isSeated = Boolean(isSeated);
    this.localState.seatedTableId = seatedTableId || null;
    this.localState.seatIndex = seatIndex || 0;
    this.localState.heldLP = heldLP
      ? {
          id: heldLP.id,
          title: heldLP.title,
          artist: heldLP.artist,
          coverImage: heldLP.coverImage || '',
          palette: heldLP.palette
        }
      : null;

    const now = performance.now();
    // Throttle continuous movement updates to ~14Hz (70ms), but send immediately on stop/sit/pick
    if (!forceImmediate && now - this.lastMoveSentAt < 70) {
      return;
    }
    this.lastMoveSentAt = now;
    this.broadcastPresence();
  }

  broadcastPresence() {
    this._sendPacket('peer-state', {
      ...this.localState,
      ts: Date.now()
    });
  }

  broadcastChatMessage(text) {
    const clean = (text || '').trim().slice(0, 120);
    if (!clean) return;
    this.localState.chatText = clean;
    this.localState.chatExpiresAt = Date.now() + 6500;
    this._sendPacket('chat-message', {
      peerId: this.peerId,
      nickname: this.localState.nickname,
      gender: this.localState.gender,
      text: clean,
      ts: Date.now()
    });
    this.broadcastPresence();
  }

  broadcastTableUpdate(tableData, actionType = 'update') {
    if (!tableData) return;
    this._sendPacket('table-update', {
      peerId: this.peerId,
      nickname: this.localState.nickname,
      actionType,
      tableId: tableData.id,
      isPlaying: Boolean(tableData.isPlaying),
      rpm: tableData.rpm || 33,
      currentLP: tableData.currentLP || null,
      ts: Date.now()
    });
  }

  broadcastUserSongAdded(songLP) {
    if (!songLP) return;
    this._sendPacket('user-song-added', {
      peerId: this.peerId,
      nickname: this.localState.nickname,
      song: songLP,
      ts: Date.now()
    });
  }

  broadcastUserSongHeart(songId, heartCount) {
    this._sendPacket('user-song-heart', {
      peerId: this.peerId,
      nickname: this.localState.nickname,
      songId,
      heartCount,
      ts: Date.now()
    });
  }

  broadcastUserCornerPlayback(activeLP, isPlaying) {
    this._sendPacket('user-corner-playback', {
      peerId: this.peerId,
      nickname: this.localState.nickname,
      activeLP: activeLP || null,
      isPlaying: Boolean(isPlaying),
      ts: Date.now()
    });
  }

  broadcastCoasterAdded(coasterNote) {
    if (!coasterNote) return;
    this._sendPacket('coaster-added', {
      peerId: this.peerId,
      coaster: coasterNote,
      ts: Date.now()
    });
  }

  broadcastMoodChanged(moodIndex, moodName) {
    this._sendPacket('mood-changed', {
      peerId: this.peerId,
      nickname: this.localState.nickname,
      moodIndex,
      moodName,
      ts: Date.now()
    });
  }

  sendStateSnapshot(snapshotData) {
    this._sendPacket('state-snapshot', {
      peerId: this.peerId,
      snapshot: snapshotData,
      ts: Date.now()
    });
  }

  getOnlineCount() {
    return 1 + this.peers.size;
  }

  getPeersArray() {
    return Array.from(this.peers.values());
  }

  // Find an unoccupied seat index (0..capacity-1) at a given table
  findAvailableSeatIndex(tableId, capacity = 2) {
    const occupied = new Set();
    for (const p of this.peers.values()) {
      if (p.isSeated && p.seatedTableId === tableId) {
        occupied.add(p.seatIndex || 0);
      }
    }
    for (let i = 0; i < capacity; i++) {
      if (!occupied.has(i)) return i;
    }
    return Math.floor(Math.random() * capacity);
  }

  // =========================================================================
  // INTERNAL TRANSPORT 1: Browser BroadcastChannel (Same-Device Multi-Tab)
  // =========================================================================
  _initBroadcastChannel() {
    if (typeof BroadcastChannel === 'undefined') return;
    try {
      this.bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      this.bc.onmessage = (ev) => {
        if (ev.data) this._handleIncomingEnvelope(ev.data);
      };
    } catch {
      this.bc = null;
    }
  }

  // =========================================================================
  // INTERNAL TRANSPORT 2: Global WSS MQTT Broker Relay
  // =========================================================================
  _connectMQTTBroker(index = 0) {
    this.brokerIndex = index % PUBLIC_MQTT_BROKERS.length;
    const brokerUrl = PUBLIC_MQTT_BROKERS[this.brokerIndex];

    if (this.mqttWs) {
      try {
        this.mqttWs.onclose = null;
        this.mqttWs.onerror = null;
        this.mqttWs.close();
      } catch {
        // ignore
      }
      this.mqttWs = null;
    }
    this.mqttConnected = false;

    let ws;
    try {
      ws = new WebSocket(brokerUrl, 'mqtt');
      ws.binaryType = 'arraybuffer';
      this.mqttWs = ws;
    } catch {
      this._scheduleMQTTFailover();
      return;
    }

    const connectTimeout = setTimeout(() => {
      if (!this.mqttConnected) {
        try {
          ws.close();
        } catch {
          // ignore
        }
      }
    }, 5500);

    ws.onopen = () => {
      try {
        const clientId = 'lpbar_' + this.peerId;
        ws.send(buildMQTTConnectPacket(clientId));
      } catch {
        // ignore
      }
    };

    ws.onmessage = (ev) => {
      const buf = new Uint8Array(ev.data);
      if (buf.length < 2) return;

      let offset = 0;
      while (offset < buf.length) {
        const headerByte = buf[offset++];
        const packetType = headerByte >> 4;

        // Decode Remaining Length
        let multiplier = 1;
        let remLen = 0;
        let encodedByte = 0;
        do {
          if (offset >= buf.length) return;
          encodedByte = buf[offset++];
          remLen += (encodedByte & 127) * multiplier;
          multiplier *= 128;
        } while ((encodedByte & 128) !== 0);

        const packetEnd = offset + remLen;
        if (packetEnd > buf.length) return;

        if (packetType === 2) {
          // CONNACK -> Subscribe to room topic
          clearTimeout(connectTimeout);
          this.mqttConnected = true;
          ws.send(buildMQTTSubscribePacket(ROOM_TOPIC, 1));

          if (this.mqttPingTimer) clearInterval(this.mqttPingTimer);
          this.mqttPingTimer = setInterval(() => {
            if (this.mqttConnected && this.mqttWs?.readyState === WebSocket.OPEN) {
              try {
                this.mqttWs.send(buildMQTTPingReqPacket());
              } catch {
                // ignore
              }
            }
          }, 20000);

          if (this.callbacks.onConnectionChange) {
            this.callbacks.onConnectionChange(true, brokerUrl);
          }

          // Broadcast our presence and request state snapshot once subscribed
          setTimeout(() => {
            this.broadcastPresence();
            this._sendPacket('state-request', { requesterId: this.peerId });
          }, 150);
        } else if (packetType === 3) {
          // PUBLISH packet received
          const topicLen = (buf[offset] << 8) | buf[offset + 1];
          let payloadOffset = offset + 2 + topicLen;
          const qos = (headerByte >> 1) & 0x03;
          if (qos > 0) payloadOffset += 2; // Packet Identifier if QoS > 0

          if (payloadOffset <= packetEnd) {
            const payloadBytes = buf.subarray(payloadOffset, packetEnd);
            try {
              const jsonStr = textDecoder.decode(payloadBytes);
              const envelope = JSON.parse(jsonStr);
              this._handleIncomingEnvelope(envelope);
            } catch {
              // ignore malformed packet
            }
          }
        }

        offset = packetEnd;
      }
    };

    ws.onerror = () => {
      clearTimeout(connectTimeout);
    };

    ws.onclose = () => {
      clearTimeout(connectTimeout);
      this.mqttConnected = false;
      if (this.mqttPingTimer) {
        clearInterval(this.mqttPingTimer);
        this.mqttPingTimer = null;
      }
      if (this.callbacks.onConnectionChange) {
        this.callbacks.onConnectionChange(false, brokerUrl);
      }
      this._scheduleMQTTFailover();
    };
  }

  _scheduleMQTTFailover() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this._connectMQTTBroker(this.brokerIndex + 1);
    }, 2200);
  }

  // =========================================================================
  // PACKET DISPATCH & DEDUPLICATION
  // =========================================================================
  _sendPacket(type, payload) {
    const msgId = this.peerId + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
    const envelope = {
      msgId,
      senderId: this.peerId,
      type,
      payload
    };

    this.seenMsgIds.add(msgId);
    if (this.seenMsgIds.size > 400) {
      const first = this.seenMsgIds.values().next().value;
      this.seenMsgIds.delete(first);
    }

    // 1. BroadcastChannel
    if (this.bc) {
      try {
        this.bc.postMessage(envelope);
      } catch {
        // ignore
      }
    }

    const jsonStr = JSON.stringify(envelope);

    // 2. Local Dev WebSocket
    if (this.localWs && this.localWs.readyState === WebSocket.OPEN) {
      try {
        this.localWs.send(jsonStr);
      } catch {
        // ignore
      }
    }

    // 3. Global WSS MQTT Broker
    if (this.mqttConnected && this.mqttWs && this.mqttWs.readyState === WebSocket.OPEN) {
      try {
        this.mqttWs.send(buildMQTTPublishPacket(ROOM_TOPIC, jsonStr));
      } catch {
        // ignore
      }
    }
  }

  _handleIncomingEnvelope(envelope) {
    if (!envelope || !envelope.msgId || !envelope.type) return;
    if (envelope.senderId === this.peerId) return;
    if (this.seenMsgIds.has(envelope.msgId)) return;

    this.seenMsgIds.add(envelope.msgId);
    if (this.seenMsgIds.size > 400) {
      const first = this.seenMsgIds.values().next().value;
      this.seenMsgIds.delete(first);
    }

    const { type, payload, senderId } = envelope;

    switch (type) {
      case 'peer-state': {
        if (!payload || !payload.peerId) return;
        const isNew = !this.peers.has(payload.peerId);
        this.peers.set(payload.peerId, {
          ...payload,
          lastSeen: Date.now()
        });
        if (this.callbacks.onPeerUpdate) {
          this.callbacks.onPeerUpdate(payload, isNew);
        }
        if (isNew && this.callbacks.onPeersCountChange) {
          this.callbacks.onPeersCountChange(this.getOnlineCount(), this.getPeersArray());
        }
        break;
      }

      case 'peer-leave': {
        const pid = payload?.peerId || senderId;
        if (this.peers.has(pid)) {
          const removed = this.peers.get(pid);
          this.peers.delete(pid);
          if (this.callbacks.onPeerLeave) {
            this.callbacks.onPeerLeave(pid, removed);
          }
          if (this.callbacks.onPeersCountChange) {
            this.callbacks.onPeersCountChange(this.getOnlineCount(), this.getPeersArray());
          }
        }
        break;
      }

      case 'state-request': {
        // Respond with our presence + bar state snapshot
        this.broadcastPresence();
        if (this.callbacks.onStateRequest) {
          this.callbacks.onStateRequest(payload?.requesterId || senderId);
        }
        break;
      }

      case 'state-snapshot': {
        if (this.callbacks.onStateSnapshot && payload?.snapshot) {
          this.callbacks.onStateSnapshot(payload.snapshot);
        }
        break;
      }

      case 'chat-message': {
        if (this.callbacks.onChatMessage && payload) {
          this.callbacks.onChatMessage(payload);
        }
        break;
      }

      case 'table-update': {
        if (this.callbacks.onTableUpdate && payload) {
          this.callbacks.onTableUpdate(payload);
        }
        break;
      }

      case 'user-song-added': {
        if (this.callbacks.onUserSongAdded && payload) {
          this.callbacks.onUserSongAdded(payload);
        }
        break;
      }

      case 'user-song-heart': {
        if (this.callbacks.onUserSongHeart && payload) {
          this.callbacks.onUserSongHeart(payload);
        }
        break;
      }

      case 'user-corner-playback': {
        if (this.callbacks.onUserCornerPlayback && payload) {
          this.callbacks.onUserCornerPlayback(payload);
        }
        break;
      }

      case 'coaster-added': {
        if (this.callbacks.onCoasterAdded && payload) {
          this.callbacks.onCoasterAdded(payload);
        }
        break;
      }

      case 'mood-changed': {
        if (this.callbacks.onMoodChanged && payload) {
          this.callbacks.onMoodChanged(payload);
        }
        break;
      }
    }
  }

  _pruneStalePeers() {
    const now = Date.now();
    let changed = false;
    for (const [pid, peer] of this.peers.entries()) {
      if (now - (peer.lastSeen || 0) > PEER_TIMEOUT_MS) {
        this.peers.delete(pid);
        changed = true;
        if (this.callbacks.onPeerLeave) {
          this.callbacks.onPeerLeave(pid, peer);
        }
      }
    }
    if (changed && this.callbacks.onPeersCountChange) {
      this.callbacks.onPeersCountChange(this.getOnlineCount(), this.getPeersArray());
    }
  }
}
