var localVideo = document.getElementById('local-video');
var remoteVideo = document.getElementById('remote-video');
var localStream = null;
var peerConnection = null;
var peerStarted = false;
var mediaConstraints = {
  'mandatory': {
    'OfferToReceiveAudio':true,
    'OfferToReceiveVideo':true
  }
};

// ----------------- handshake --------------
var localSDP = document.getElementById('localSdp');
var remoteSDP = document.getElementById('remoteSdp');
var localICE = document.getElementById('localIce');
var remoteICE = document.getElementById('remoteIce');
var iceSeparator = '------ ICE Candidate -------';
var CR = String.fromCharCode(13);

function sendSDP(sdp) {
  var text = JSON.stringify(sdp);
  console.log("---sending sdp text ---");
  console.log(text);
  localSDP.value = text;
}


function offer(sdp) {
  console.log("Received offer...", sdp);

  // set offer
  peerConnection = prepareNewConnection();
  peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));

  // send answer
  console.log('sending Answer. Creating remote session description...');

  peerConnection.createAnswer(function success(sdp) {
    peerConnection.setLocalDescription(sdp);

    console.log("Sending: SDP", sdp);
    sendSDP(sdp);
  }, function error() {
    console.log("Create Answer failed");
  }, mediaConstraints);
}

function answer(sdp) {
  console.log("Received Answer...", sdp);
  peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
}

//--- multi ICE candidate ---

function onCandidate(cand) {
  var candidate = new RTCIceCandidate({
    sdpMLineIndex: cand.sdpMLineIndex,
    sdpMid: cand.sdpMid,
    candidate: cand.candidate
  });
  console.log("Received Candidate...");
  console.log(candidate);
  peerConnection.addIceCandidate(candidate);
}


function sendCandidate(candidate) {
  var text = JSON.stringify(candidate);
  console.log("---sending candidate text ---");
  console.log(text);

  localICE.value = (localICE.value + CR + iceSeparator + CR + text + CR);
  localICE.scrollTop = localICE.scrollHeight;
}

// ---------------------- connection handling -----------------------
function prepareNewConnection() {
  var pcConfig = { "iceServers": [] };
  var peer = null;
  try {
    peer = new webkitRTCPeerConnection(pcConfig);
  } catch (e) {
    console.log("Failed to create peerConnection, exception: " + e.message);
  }

  // send any ice candidates to the other peer
  peer.onicecandidate = function (evt) {
    if (evt.candidate) {
      console.log(evt.candidate);
      sendCandidate({
        type: "candidate",
        sdpMLineIndex: evt.candidate.sdpMLineIndex,
        sdpMid: evt.candidate.sdpMid,
        candidate: evt.candidate.candidate
      });
    } else {
      console.log("End of candidates. ------------------- phase=" + evt.eventPhase);
    }
  };

  console.log('Adding local stream...');
  // peer.addStream(localStream);

  peer.addEventListener("addstream", onRemoteStreamAdded, false);
  peer.addEventListener("removestream", onRemoteStreamRemoved, false);

  // when remote adds a stream, hand it on to the local video element
  function onRemoteStreamAdded(event) {
    console.log("Added remote stream");
    remoteVideo.src = window.webkitURL.createObjectURL(event.stream);
  }

  // when remote removes a stream, remove it from the local video element
  function onRemoteStreamRemoved(event) {
    console.log("Remove remote stream");
    remoteVideo.src = "";
  }

  return peer;
}

var config = {
  media: { video: true, audio: false }
}

window.onload = function() {
  // start video
  var $startVideo = document.getElementById("startVideo");
  $startVideo.onclick = function startVideo() {
    navigator.webkitGetUserMedia(config.media, function success(stream) {
      localStream = stream;
      localVideo.src = window.webkitURL.createObjectURL(stream);
      localVideo.play();
      localVideo.volume = 0;
    }, function error(err) {
      console.error(err, err.code)
    });
  }

  // stop video
  var $stopVideo  = document.getElementById("stopVideo");
  $stopVideo.onclick = function stopVideo() {
    localVideo.src = "";
    localStream.stop();
  }

  // connect
  var $conect     = document.getElementById("connect");
  $conect.onclick = function connect() {
    //if (!peerStarted && localStream && channelReady) {
    //if (!peerStarted && localStream) {
    //  sendOffer();
    //  peerStarted = true;
    //} else {
    //  alert("Local stream not running yet - try again.");
    //}
    if (peerStarted) return;
    peerConnection = prepareNewConnection();
    peerConnection.createOffer(function success(sdp) {
      peerConnection.setLocalDescription(sdp);
      console.log("Sending: SDP", sdp);
      sendSDP(sdp);
    }, function error() { // in case of error
      console.log("Create Offer failed");
    }, mediaConstraints);

    peerStarted = true;
  }

  // hangup
  var $hangUp     = document.getElementById("hangUp");
  $hangUp.onclick = function hangUp() {
    console.log("Hang up.");
    peerConnection.close();
    peerConnection = null;
    peerStarted = false;
  }

  // Receive SDP
  var $recvSDP = document.getElementById("recvSDP");
  $recvSDP.onclick = function recvSDP() {
    var text = remoteSDP.value;
    var sdp = JSON.parse(text);
    if (peerConnection) {
      answer(sdp);
    } else {
      offer(sdp);
    }
    remoteSDP.value ="";
  }

  var $recvICE = document.getElementById("recvICE");
  $recvICE.onclick = function recvICE() {
    var text = remoteICE.value;
    var arr = text.split(iceSeparator);
    for (var i = 1, len = arr.length; i < len; i++) {
      var evt = JSON.parse(arr[i]);
      onCandidate(evt);
    }

    remoteICE.value ="";
  };
  }
