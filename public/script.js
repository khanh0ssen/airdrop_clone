const socket = io();  
let peerConnection;
let dataChannel;

// Start Sharing Button
document.getElementById("startShare").addEventListener("click", () => {
    socket.emit("findPeers");
});

// Select File
document.getElementById("fileInput").addEventListener("change", function(event) {
    const file = event.target.files[0];
    document.getElementById("fileInfo").innerText = `Selected: ${file.name}`;
    document.getElementById("sendFile").style.display = "block";
});

// Send File
document.getElementById("sendFile").addEventListener("click", () => {
    const file = document.getElementById("fileInput").files[0];
    sendFile(file);
});

// WebRTC Connection
socket.on("peerFound", async (peerId) => {
    peerConnection = new RTCPeerConnection();
    dataChannel = peerConnection.createDataChannel("fileTransfer");

    dataChannel.onopen = () => console.log("Data channel open");
    dataChannel.onmessage = (event) => receiveFile(event.data);

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("sendOffer", { offer, to: peerId });

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit("sendCandidate", { candidate: event.candidate, to: peerId });
        }
    };
});

// Handle Offer
socket.on("receiveOffer", async ({ offer, from }) => {
    peerConnection = new RTCPeerConnection();
    peerConnection.ondatachannel = (event) => {
        dataChannel = event.channel;
        dataChannel.onmessage = (event) => receiveFile(event.data);
    };

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("sendAnswer", { answer, to: from });

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit("sendCandidate", { candidate: event.candidate, to: from });
        }
    };
});

// Handle Answer
socket.on("receiveAnswer", async ({ answer }) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

// Handle ICE Candidate
socket.on("receiveCandidate", ({ candidate }) => {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

// Send File Data
function sendFile(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        dataChannel.send(event.target.result);
    };
    reader.readAsArrayBuffer(file);
}

// Receive File Data
function receiveFile(data) {
    const blob = new Blob([data]);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "received_file";
    link.innerText = "Download File";
    document.body.appendChild(link);
}