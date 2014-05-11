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

$(function() {
  var peer = new Peer(config);

  var $localVideo = $('#local-video').get(0);
  var $remoteVideo = $('#remote-video').get(0);
  var $thirdVideo = $('#third-video').get(0);

  socket.on('stop', function() {
    $('#stop').click();
  });

  $('#connect').click(function() {
    // create peer requester
    peer.connect(config);

    // add stream
    peer.on('addstream', function(e) {
      console.log('addStream');
      $remoteVideo.src = URL.createObjectURL(e.stream);
    });

    peer.on('removestream', function(e) {
      console.log('removeStream');
      $remoteVideo.src = '';
    });

    peer.on('open', function() {
      console.log('web rtc connection open');
    });
  });

  // stop
  $('#stop').click(function() {
    $localVideo.src = '';
    $remoteVideo.src = '';
    if (localStream) {
      localStream.stop();
    }
    socket.disconnect();
    if (requester) {
      requester.close();
      requester = null;
    } else if (responser) {
      responser.close();
      responser = null;
    }
  });

  $('#video').click(function() {
    // start video
    navigator.webkitGetUserMedia(config.media, function success(stream) {
      localStream = stream;
      $localVideo.src = URL.createObjectURL(stream);
      $localVideo.play();
      $localVideo.volume = 0;
    }, console.error);
  });
});
