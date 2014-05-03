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

  // stop video
  $('#stopVideo').click(function() {
    $localVideo.src = "";
  });

  $('#connect').click(function() {
    // create peer requester
    requester = new webkitRTCPeerConnection(config.requester);

    // offer
    requester.createOffer(function success(sdp) {
      console.log(sdp);
      requester.setLocalDescription(sdp);
      socket.emit('offer', sdp);
    }, console.error, config.rtcoption);
  });

  socket.on('offer', function(sdp) {
    // create peer responser
    responser = new webkitRTCPeerConnection(config.responser);
    responser.setRemoteDescription(new RTCSessionDescription(sdp));
    console.log(responser);

    // answer
    responser.createAnswer(function success(ans) {
      responser.setLocalDescription(ans);
      console.log(ans);
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
