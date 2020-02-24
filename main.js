function browserPlatformDetection() {
    var system = {}
    var np = navigator.platform;
    var ua = navigator.userAgent;
    system.win = np.indexOf("Win") === 0;
    system.mac = np.indexOf("Mac") === 0;
    system.xll = (np === "X11") || (np.indexOf("Linux") === 0);
    var isMobile = /Android|SymbianOS|Windows Phone|webOS|iPhone|iPad|iPod|BlackBerry/i.test(ua);
    var isPc = (system.win || system.mac || system.xll) && !isMobile;
    console.warn("isPc: ", isPc)
    console.warn("isMobile: ", isMobile)
    return {
        isMobile: isMobile,
        isPc: isPc
    }
}
browserPlatformDetection()


function enumDevices(deviceInfoCallback) {
    if (navigator.mediaDevices === undefined || navigator.mediaDevices.enumerateDevices === undefined) {
        console.error("browser don't support enumerate devices")
        return
    }

    navigator.mediaDevices.enumerateDevices().then(function (deviceInfos) {
        var microphone = []
        var speaker = []
        var camera = []
        var screenResolution = []
        var isConstraintsKeywordSupport = true
        for (var i = 0; i < deviceInfos.length; i++) {
            var deviceInfo = deviceInfos[i]
            if(deviceInfo.deviceId === 'default' || deviceInfo.deviceId === 'communications'){
                continue
            }
            if (deviceInfo.kind === 'audioinput') {
                microphone.push({
                    label: deviceInfo.label,
                    deviceId: deviceInfo.deviceId,
                    groupId: deviceInfo.groupId,
                    status: 'available',
                })
            }
            if (deviceInfo.kind === 'audiooutput') {
                speaker.push({
                    label: deviceInfo.label,
                    deviceId: deviceInfo.deviceId,
                    groupId: deviceInfo.groupId,
                    status: 'available',
                })
            }
            if (deviceInfo.kind === 'videoinput') {
                camera.push({
                    label: deviceInfo.label,
                    deviceId: deviceInfo.deviceId,
                    groupId: deviceInfo.groupId,
                    status: 'available',
                    capability: []
                })
            }
        }

        screenResolution.push({
            width: window.screen.width,
            height: window.screen.height,
        })

        var result = {
            microphones: microphone,
            speakers: speaker,
            cameras: camera,
            screenResolution: screenResolution,
            isConstraintsKeywordSupport: isConstraintsKeywordSupport
        }

        console.warn("deviceInfos: ", JSON.stringify(result.cameras, null, ' '))
        deviceInfoCallback(result)
        // return result
    }).catch(function (err) {
        console.error(err)
    })
}


(function () {
    enumDevices(deviceInfo => {
        let videoInputList = []
        let audioOutputList = []
        console.warn("deviceInfo.cameras: ", deviceInfo.cameras)
        if (deviceInfo.cameras) {
            videoInputList.push('<option>请选择</option>>')
            for (let i = 0; i < deviceInfo.cameras.length; i++) {
                if (!deviceInfo.cameras[i].label) {
                    deviceInfo.cameras[i].label = 'camera' + i
                }
                videoInputList.push('<option class="cameraOption" value="' + deviceInfo.cameras[i].deviceId + '">' + deviceInfo.cameras[i].label + '</option>')
                console.log('camera: ' + deviceInfo.cameras[i].label)
            }
            document.getElementById('videoList').innerHTML = videoInputList.join('')
        }

        let audioOutput = deviceInfo.speakers.length > 0 ? deviceInfo.speakers : deviceInfo.microphones
        console.warn("get audioOutput: ", audioOutput)
        if(audioOutput){
            audioOutputList.push('<option>请选择</option>>')
            for (let j = 0; j < audioOutput.length; j++) {
                if (!audioOutput[j].label) {
                    audioOutput[j].label = 'speakers' + j
                }
                // 过滤default 和 communications 类型
                if(audioOutput[j].deviceId !== 'default' && audioOutput[j].deviceId !== 'communications'){
                    audioOutputList.push('<option class="cameraOption" value="' + audioOutput[j].deviceId + '">' + audioOutput[j].label + '</option>')
                    console.log('speakers: ' + audioOutput[j].label)
                }
            }
            document.getElementById('audioList').innerHTML = audioOutputList.join('')
        }
    }, function (error) {
        console.error('enum device error: ' + error)
    })
})()


function switchAudioSource() {
    console.warn("switch audio source")
    let audioList = document.getElementById('audioList').options
    if(audioList && audioList.length > 0){
        var audioElement = document.getElementById('localAudio')
        let selectDevice = audioList[audioList.selectedIndex]
        console.info("selectDevice: ", selectDevice.label)
        console.info(" selectDevice.value: ",  selectDevice.value)
        var constraints = {
            audio: {
                deviceId:  selectDevice.value
            },
            video: false
        }

        console.warn('getUserMedia constraints is :' + JSON.stringify(constraints, null, '    '))
        navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
            window.stream = stream
            console.warn("get audio stream success： ", stream)
            audioElement.srcObject = stream;

        }).catch(function (error) {
            console.warn("get stream failed！！")
            console.error(error)
        })

    }else {
        alert('No device here! plug device and Try again!')
    }
}


function shareVideo(){
    closeStream()
    let videoList = document.getElementById('videoList').options
    if(videoList && videoList.length > 0){
        let selectDevice = videoList[videoList.selectedIndex]
        console.warn("selectDevice: ", selectDevice.label)
        var deviceId = selectDevice.value
        console.log("deviceId： ", deviceId)
        if(deviceId === '请选择'){
            console.warn("请先选择摄像头！！！")
            return
        }

        var constraints = {
            audio: false,
            video: {
                width: {
                    exact: 640
                },
                height: {
                    exact: 360
                },
                deviceId: {
                    exact: deviceId
                }
            }
        }

        console.warn('getUserMedia constraints is :' + JSON.stringify(constraints, null, '    '))
        navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
            window.stream = stream
            console.warn("取流成功： ", stream)
            var video = document.querySelector('video');
            video.srcObject = stream;

            video.onloadedmetadata = function (e) {
                console.warn("Stream dimensions for :" + video.videoWidth + "x" + video.videoHeight);
            };
        }).catch(function (error) {
            console.warn("取流失败！！")
            console.error(error)
        })

    }else {
        alert('No device here! plug device and Try again!')
    }
}


function applyConstraints(width, height) {
    var constraints = {
        width: {
            exact: width
        },
        height: {
            exact: height
        }
    };

    var localVideoTrack = window.stream.getVideoTracks()[0];
    localVideoTrack.applyConstraints(constraints).then(function () {
        console.info('applyConstraints succeed', JSON.stringify(constraints, null, '    '));

        var video = document.querySelector('video');
        // 旧的浏览器可能没有srcObject
        if ("srcObject" in video) {
            video.srcObject = stream;
        } else {
            // 防止在新的浏览器里使用它，应为它已经不再支持了
            video.src = window.URL.createObjectURL(stream);
        }
        video.onloadedmetadata = function (e) {
            video.play();
            console.warn("Stream dimensions for :" + video.videoWidth + "x" + video.videoHeight);
        };
    }).catch(function (error) {
        console.info("applyConstraints Error: ", error.name);
    })
}

function getCameraStream(facingMode) {
    closeStream()
    var constraints = {
        audio: false,
        video: {
            facingMode: {
                exact: facingMode
            }
        }
    }

    console.warn('constraints' + JSON.stringify(constraints, null, '    '))
    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
        window.stream = stream
        console.warn("get stream success: " + JSON.stringify(constraints, null, '    '))
        var video = document.querySelector('video');
        video.srcObject = stream;

        video.onloadedmetadata = function (e) {
            console.warn("Stream dimensions for :" + video.videoWidth + "x" + video.videoHeight);
        };
    }).catch(function (err) {
        console.error(err);
        console.error(err.toString());
    })
}

function closeStream() {
    if(window.stream){
        console.log("清除流！！")
        window.stream.oninactive = null;
        var tracks = window.stream.getTracks();
        for (var track in tracks) {
            tracks[track].onended = null;
            console.info("close stream");
            tracks[track].stop();
        }

        var videoElement = document.getElementById('video')
        videoElement.srcObject = null
    }else {
        console.warn("window.stream: ", window.stream)
    }
}