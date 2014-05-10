var REQUESTER = "requester"
  , RESPONSER = "responser"
  ;

function Peer() {
  this.context = "";
  this.peer = null;
  this.channel = null;
  this.initialize();
};

Peer.prototype.createPeer = function() {
  console.log('create peer', this.context);
  var self = this;
  self.peer = new webkitRTCPeerConnection(config.peer);

  // candidate
  self.peer.onicecandidate = function(ice) {
    console.log('ice', this.context, ice);
    if (ice.candidate) {
      console.log(prittyice(ice.candidate));
      socket.emit('ice', this.context, ice.candidate);
    } else {
     // console.log('==END CANDIDATE==');
    }
  }
}

Peer.prototype.initialize = function() {
  var self = this;
  socket.on('offer', function(offer) {
    console.log('offer', this.context, offer);
    if (self.context == REQUESTER) {
      throw new Error("invalid context: onOffer in requester");
    }
    self.context = RESPONSER;

    // create peer responser
    self.createPeer();
    self.peer.setRemoteDescription(new RTCSessionDescription(offer));

    // answer
    self.peer.createAnswer(function success(ans) {
      console.log('create answer', this.context);
      self.peer.setLocalDescription(ans);

      self.peer.ondatachannel = function(e) {
        // data channel
        this.channel = e.channel;
      };
      console.log(prittysdp(ans));
      socket.emit('answer', this.context, ans);
    }, console.error, config.rtcoption);
  });

  socket.on('answer', function(sdp) {
    console.log('answer', this.context);
    console.log(sdp);
    self.peer.setRemoteDescription(new RTCSessionDescription(sdp));
  });

  socket.on('ice', function(ice) {
    console.log('ice', this.context);
    var candidate = new RTCIceCandidate(ice);
    self.peer.addIceCandidate(candidate);
  });
}

Peer.prototype.connect = function() {
  console.log('connect', this.context);

  var self = this;
  self.context = REQUESTER;
  self.createPeer();

  // data channel
  self.channel = self.peer.createDataChannel('RTCDataChannel', config.channel);

  self.peer.createOffer(function success(offer) {
    console.log('create offer', this.context);
    console.log(prittysdp(offer));
    self.peer.setLocalDescription(offer);
    socket.emit('offer', this.context, offer);
  }, console.error, config.rtcoption);
}

Peer.prototype.on = function(eventname, cb) {
  this.peer.addEventListener(eventname, cb, false);
}
