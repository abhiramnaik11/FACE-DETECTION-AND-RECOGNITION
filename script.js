const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");


let ageSamples = [];
let genderSamples = [];

const MAX_SAMPLES = 10; 


Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri("models"), 
    faceapi.nets.ageGenderNet.loadFromUri("models")
]).then(startVideo);

function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => {
            video.srcObject = stream;
        })
        .catch(err => console.error("Error accessing webcam:", err));
}

video.addEventListener("play", () => {
    canvas.width = video.width;
    canvas.height = video.height;

    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withAgeAndGender();

        if (detections.length > 0) { 
            const largestFace = detections.reduce((max, face) => 
                (face.detection.box.area > max.detection.box.area ? face : max), detections[0]);

            
            if (ageSamples.length >= MAX_SAMPLES) ageSamples.shift(); 
            if (genderSamples.length >= MAX_SAMPLES) genderSamples.shift();

            ageSamples.push(largestFace.age);
            genderSamples.push(largestFace.gender);

            
            const avgAge = Math.round(ageSamples.reduce((sum, age) => sum + age, 0) / ageSamples.length);
            const genderCounts = genderSamples.reduce((acc, g) => ((acc[g] = (acc[g] || 0) + 1), acc), {});
            const mostFrequentGender = Object.keys(genderCounts).reduce((a, b) => (genderCounts[a] > genderCounts[b] ? a : b));

            
            const resizedDetections = faceapi.resizeResults([largestFace], { width: video.width, height: video.height });

           
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            
            faceapi.draw.drawDetections(canvas, resizedDetections);

           
            new faceapi.draw.DrawTextField(
                [`Age: ${avgAge}`, `Gender: ${mostFrequentGender}`],
                largestFace.detection.box.bottomRight
            ).draw(canvas);
        }
    }, 200); 
});
