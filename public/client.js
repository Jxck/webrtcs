function prittysdp(sdp) {
  var text = 'type:' + sdp.type + '\n';
  text += sdp.sdp;
  return text
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

  // stop video
  $('#stopVideo').click(function() {
    $localVideo.src = "";
  });


  $('#connect').click(function() {
    // create peer requester
    requester = new webkitRTCPeerConnection(config.requester);

    // offer
    requester.createOffer(function success(offer) {
      $sdp.text(prittysdp(offer));
      requester.setLocalDescription(offer);
      socket.emit('offer', offer);
    }, console.error, config.rtcoption);
  });

  socket.on('offer', function(offer) {
    // create peer responser
    responser = new webkitRTCPeerConnection(config.responser);
    responser.setRemoteDescription(new RTCSessionDescription(offer));
    console.log(responser);

    // answer
    responser.createAnswer(function success(ans) {
      responser.setLocalDescription(ans);
      $sdp.text(prittysdp(ans));
      socket.emit('answer', ans);
    }, console.error, config.rtcoption);
  });

  socket.on('answer', function(sdp) {
    console.log(sdp);
    requester.setRemoteDescription(new RTCSessionDescription(sdp));
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
