var REQUESTER = "requester"
  , RESPONSER = "responser"
  ;

function Channel(channel) {
  console.log('channel', channel);
  this.channel = channel;

  var $chatView = $('#chatView');
  var $chatInput = $('#chatInput');
  var $chatSubmit = $('#chatSubmit');

  channel.onopen = function () {
    console.log('chat open');
    $chatInput.prop('disabled', false);
  };

  channel.onmessage = function (e) {
    $chatView.val($chatView.val() + e.data + '\n');
    console.log("Got Data Channel Message:", e.data);
  };

  channel.onerror = function (error) {
    $chatInput.prop('disabled', true);
    console.log("Data Channel Error:", error);
  };

  channel.onclose = function () {
    $chatInput.prop('disabled', true);
    console.log("The Data Channel is Closed");
  };

  $chatSubmit.click(function() {
    var message = $chatInput.val();
    channel.send(message);
    $chatView.val($chatView.val() + message + '\n');
  });
}

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
    console.log('ice', self.context, ice);
    if (ice.candidate) {
      console.log(prittyice(ice.candidate));
      socket.emit('ice', ice.candidate);
    } else {
      console.log('==END CANDIDATE==');
    }
  }
}

Peer.prototype.initialize = function() {
  var self = this;
  socket.on('offer', function(offer) {
    console.log('offer', self.context, offer);
    if (self.context == REQUESTER) {
      throw new Error("invalid context: onOffer in requester");
    }
    self.context = RESPONSER;

    // create peer responser
    self.createPeer();
    self.peer.setRemoteDescription(new RTCSessionDescription(offer));

    // answer
    self.peer.createAnswer(function success(ans) {
      console.log('create answer', self.context);
      self.peer.setLocalDescription(ans);

      self.peer.ondatachannel = function(e) {
        // data channel
        this.channel = new Channel(e.channel);
      };
      console.log(prittysdp(ans));
      socket.emit('answer', ans);
    }, console.error, config.rtcoption);
  });

  socket.on('answer', function(sdp) {
    console.log('answer', self.context);
    console.log(sdp);
    self.peer.setRemoteDescription(new RTCSessionDescription(sdp));
  });

  socket.on('ice', function(ice) {
    console.log('ice', self.context);
    console.log('ice', ice);
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
  var channel = self.peer.createDataChannel('RTCDataChannel', config.channel);
  self.channel = new Channel(channel);

  self.peer.createOffer(function success(offer) {
    console.log('create offer', self.context);
    console.log(prittysdp(offer));
    self.peer.setLocalDescription(offer);
    socket.emit('offer', offer);
  }, console.error, config.rtcoption);
}

Peer.prototype.on = function(eventname, cb) {
  this.peer.addEventListener(eventname, cb, false);
}
