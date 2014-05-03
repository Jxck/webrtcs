function prittysdp(sdp) {
  var text = 'type:' + sdp.type + '\n';
  text += sdp.sdp;
  return text
}

function prittyice(ice) {
  var text = JSON.stringify(ice, null, "       ");
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
  }
}

// サーバに接続(localhost)
var socket = io.connect();

var requester = null;
var responser = null;

$(function() {
  var $localVideo = $('#local-video').get(0);
  var $sdp = $('#sdp');
  var $ice = $('#ice');

  // stop video
  $('#stopVideo').click(function() {
    $localVideo.src = "";
  });

  socket.on('offer', function(offer) {
    // create peer responser
    responser = new webkitRTCPeerConnection(config.responser);
    responser.setRemoteDescription(new RTCSessionDescription(offer));

    // candidate
    responser.onicecandidate = function(ice) {
      if (ice.candidate) {
        $ice.text($ice.text() + '\n' + prittyice(ice.candidate));
        console.log(ice.candidate);
        socket.emit('ice', ice.candidate);
      } else {
        $ice.text($ice.text() + '\n==END CANDIDATE==');
      }
    }

    // answer
    responser.createAnswer(function success(ans) {
      responser.setLocalDescription(ans);
      $sdp.text(prittysdp(ans));
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

  $('#connect').click(function() {
    // create peer requester
    requester = new webkitRTCPeerConnection(config.requester);

    // candidate
    requester.onicecandidate = function(ice) {
      if (ice.candidate) {
        $ice.text($ice.text() + '\n' + prittyice(ice.candidate));
        socket.emit('ice', ice.candidate);
      } else {
        $ice.text($ice.text() + '\n==END CANDIDATE==');
      }
    }

    // offer
    requester.createOffer(function success(offer) {
      $sdp.text(prittysdp(offer));
      requester.setLocalDescription(offer);
      socket.emit('offer', offer);
    }, console.error, config.rtcoption);
  });


  // start video
  // navigator.webkitGetUserMedia(config.media, function success(stream) {
  //   $localVideo.src = window.webkitURL.createObjectURL(stream);
  //   $localVideo.play();
  //   $localVideo.volume = 0;
  // }, console.error);


  // // 送信
  // $('#ok').on('click', function() { // クリックしたら
  //   var message = $('#message').val(); // 中身を取って
  //   socket.emit('message', message); // サーバに送信
  // });

  // // 受信
  // socket.on('message', function(data) { // 受信したら
  //   var $li = $('<li>', { text: data }); // li を作って
  //   $('#messages').append($li); // ul に追加
  // });
});
