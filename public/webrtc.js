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

function Peer(config) {
  events.EventEmitter.call(this);
  this.config = config;
  this.context = "";
  this.peer = null;
  this.channel = null;
  this.initialize();
};

util.inherits(Peer, events.EventEmitter);

Peer.prototype.createPeer = function() {
  console.log('create peer', this.context);
  var self = this;
  self.peer = new webkitRTCPeerConnection(config.peer);

  // candidate
  self.peer.onicecandidate = function(ice) {
    // console.log('ice', self.context, ice);
    if (ice.candidate) {
      // console.log(prittyice(ice.candidate));
      socket.emit('ice', ice.candidate);
    } else {
      console.log('==END CANDIDATE==');
      self.emit('open');
    }
  }
}

Peer.prototype.initialize = function() {
  var self = this;

  socket.on('offer', function(sdp) {
    // console.log('offer', self.context, sdp);
    if (self.context == REQUESTER) {
      throw new Error("invalid context: onOffer in requester");
    }
    self.context = RESPONSER;

    // create peer responser
    self.createPeer();
    self.peer.setRemoteDescription(new RTCSessionDescription(sdp));

    // answer
    self.peer.createAnswer(function success(ans) {
      // console.log('create answer', self.context, prittysdp(ans));
      self.peer.setLocalDescription(ans);

      // data channel
      self.peer.ondatachannel = function(e) {
        self.channel = new Channel(e.channel);
      };

      socket.emit('answer', ans);
    }, console.error, self.config.rtcoption);
  });

  socket.on('answer', function(sdp) {
    // console.log('answer', self.context, sdp);
    self.peer.setRemoteDescription(new RTCSessionDescription(sdp));
  });

  socket.on('ice', function(ice) {
    // console.log('ice', self.context, ice);
    var candidate = new RTCIceCandidate(ice);
    self.peer.addIceCandidate(candidate);
  });
}

Peer.prototype.connect = function() {
  console.log('connect', this.context);

  var self = this;
  self.context = REQUESTER;
  self.createPeer();

  self.peer.addEventListener('addstream', function(e) {
    self.emit('addStream', e);
  }, false);

  self.peer.removeEventListener('removestream', function(e) {
    self.emit('removeStream', e);
  }, false);

  // data channel
  var channel = self.peer.createDataChannel('RTCDataChannel', config.channel);
  self.channel = new Channel(channel);

  self.peer.createOffer(function success(offer) {
    // console.log('create offer', self.context, prittysdp(offer));
    self.peer.setLocalDescription(offer);
    socket.emit('offer', offer);
  }, console.error, self.config.rtcoption);
}
