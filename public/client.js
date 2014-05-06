function prittysdp(sdp) {
  var text = 'type:' + sdp.type + '\n';
  text += sdp.sdp;
  return text
}

function prittyice(ice) {
  var text = JSON.stringify(ice, null, "    ");
  return text;
}

var config = {
  media: {
    video: true,
    audio: false
  },
  peer: {
    iceServers: []
  },
  rtcoption: {
    mandatory: {
      OfferToReceiveAudio:true,
      OfferToReceiveVideo:true
    }
  },
  channel: {
    ordered: false,
    maxRetransmitTime: 3000
  }
}

// サーバに接続(localhost)
var socket = io.connect();

var requester = null;
var responser = null;
var localStream = null;

function chat(dataChannel) {
  dataChannel.onerror = function (error) {
    console.log("Data Channel Error:", error);
  };

  dataChannel.onmessage = function (event) {
    console.log("Got Data Channel Message:", event.data);
  };

  dataChannel.onopen = function () {
    dataChannel.send("Hello World!");
  };

  dataChannel.onclose = function () {
    console.log("The Data Channel is Closed");
  };
}

$(function() {
  var $localVideo = $('#local-video').get(0);
  var $remoteVideo = $('#remote-video').get(0);
  var $thirdVideo = $('#third-video').get(0);

  socket.on('offer', function(offer) {
    // create peer responser
    responser = new webkitRTCPeerConnection(config.responser);
    responser.setRemoteDescription(new RTCSessionDescription(offer));

    // add stream
    responser.addStream(localStream);
    responser.onaddstream = function(e) {
      $remoteVideo.src = URL.createObjectURL(e.stream);
    }
    responser.onremovestream = function(e) {
      $remoteVideo.src = '';
    }

    // candidate
    responser.onicecandidate = function(ice) {
      if (ice.candidate) {
        console.log(prittyice(ice.candidate));
        socket.emit('ice', ice.candidate);
      } else {
        console.log('==END CANDIDATE==');
      }
    }

    // answer
    responser.createAnswer(function success(ans) {
      responser.setLocalDescription(ans);

      responser.ondatachannel = function(e) {
        // data channel
        var dataChannel = e.channel;
        chat(dataChannel);

      };
      console.log(prittysdp(ans));
      socket.emit('answer', ans);
    }, console.error, config.rtcoption);
  });

  socket.on('answer', function(sdp) {
    requester.setRemoteDescription(new RTCSessionDescription(sdp));
  });

  socket.on('ice', function(ice) {
    var candidate = new RTCIceCandidate(ice);
    if (requester) {
      requester.addIceCandidate(candidate);
    } else {
      responser.addIceCandidate(candidate);
    }
  });

  socket.on('stop', function() {
    $('#stop').click();
  });

  $('#connect').click(function() {
    // create peer requester
    requester = new webkitRTCPeerConnection(config.requester);

    // data channel
    var dataChannel = requester.createDataChannel('RTCDataChannel', config.channel);
    chat(dataChannel);

    // add stream
    requester.addStream(localStream);
    requester.onaddstream = function(e) {
      $remoteVideo.src = URL.createObjectURL(e.stream);
    }
    requester.onremovestream = function(e) {
      $remoteVideo.src = '';
    }

    // candidate
    requester.onicecandidate = function(ice) {
      if (ice.candidate) {
        console.log(prittyice(ice.candidate));
        socket.emit('ice', ice.candidate);
      } else {
        console.log('==END CANDIDATE==');
      }
    }

    // offer
    requester.createOffer(function success(offer) {
      console.log(prittysdp(offer));
      requester.setLocalDescription(offer);
      socket.emit('offer', offer);
    }, console.error, config.rtcoption);
  });

  // stop
  $('#stop').click(function() {
    $localVideo.src = '';
    $remoteVideo.src = '';
    localStream.stop();
    socket.disconnect();
    if (requester) {
      requester.close();
      requester = null;
    } else {
      responser.close();
      responser = null;
    }
  });

  // start video
  navigator.webkitGetUserMedia(config.media, function success(stream) {
    localStream = stream;
    $localVideo.src = URL.createObjectURL(stream);
    $localVideo.play();
    $localVideo.volume = 0;
  }, console.error);
});
