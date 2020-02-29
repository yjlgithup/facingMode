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
            // if(deviceInfo.deviceId === 'default' || deviceInfo.deviceId === 'communications'){
            //     continue
            // }
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

        if (deviceInfo.speakers) {
            audioOutputList.push('<option>请选择</option>>')
            for (let i = 0; i < deviceInfo.speakers.length; i++) {
                if (!deviceInfo.speakers[i].label) {
                    deviceInfo.speakers[i].label = 'speaker' + i
                }
                audioOutputList.push('<option class="cameraOption" value="' + deviceInfo.speakers[i].deviceId + '">' + deviceInfo.speakers[i].label + '</option>')
                console.log('speaker: ' + deviceInfo.speakers[i].label)
            }
            document.getElementById('audioList').innerHTML = audioOutputList.join('')
        }
    }, function (error) {
        console.error('enum device error: ' + error)
    })
})()


function audioVideo() {
    let audioList = document.getElementById('audioList').options
    if(audioList && audioList.length > 0){
        let selectDevice = audioList[audioList.selectedIndex]
        console.warn("selectDevice: ", selectDevice.label)
        var deviceId = selectDevice.value
        console.log("deviceId： ", deviceId)
        if(deviceId === '请选择'){
            console.warn("请先选择麦克风！！！")
            return
        }

        if(window.audioStream){
            console.warn("清除之前的音频流！！！")
            var tracks = window.audioStream.getTracks();
            for (var track in tracks) {
                tracks[track].onended = null;
                console.info("close audio stream");
                tracks[track].stop();
            }

        }

        var constraints = {
            audio: deviceId,
            video: false
        }

        console.warn('audio constraints is :' + JSON.stringify(constraints, null, '    '))
        navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
            window.audioStream = stream
            console.warn("取流成功： ", stream)
            var audioElement = document.querySelector('audio');
            audioElement.srcObject = stream;
        }).catch(function (error) {
            console.warn("取流失败！！")
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

/**
 * 判断是否为移动端设备：还是不准确
 * @returns {boolean}
 */
function isMobileDevice(){
    // var userAgent = navigator.userAgent
    var userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.1 Safari/605.1.15"
    let ua = userAgent.toLowerCase();
    var result = (ua.indexOf("mobile") !== -1 || ua.indexOf("crios") !== -1 || /(Macintosh|iPhone|iPad|iPod|iOS)/i.test(ua));
}

isMobileDevice()

var browser = {
    versions:function(){
        var u = navigator.userAgent;
        var app = navigator.appVersion;
        return {
            trident: u.indexOf('Trident') > -1, //IE内核
            presto: u.indexOf('Presto') > -1, //opera内核
            webKit: u.indexOf('AppleWebKit') > -1, //苹果、谷歌内核
            gecko: u.indexOf('Gecko') > -1 && u.indexOf('KHTML') == -1,//火狐内核
            mobile: !!u.match(/AppleWebKit.*Mobile.*/), //是否为移动终端
            ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/), //ios终端
            android: u.indexOf('Android') > -1 || u.indexOf('Adr') > -1, //android终端
            iPhone: u.indexOf('iPhone') > -1 , //是否为iPhone或者QQHD浏览器
            iPad: u.indexOf('iPad') > -1, //是否iPad
            webApp: u.indexOf('Safari') == -1, //是否web应该程序，没有头部与底部
            weixin: u.indexOf('MicroMessenger') > -1, //是否微信 （2015-01-22新增）
            qq: u.match(/\sQQ/i) == " qq" //是否QQ
        };
    }(),
    language:(navigator.browserLanguage || navigator.language).toLowerCase()
}


function a(c) {
    var mod = {
        isAndroid: function() {
            return /android/i.test(c)
        },
        isIOS: function() {
            return /(iPhone|iPod|iPad)/.test(c)
        },
        isWinPhone: function() {
            return /Windows Phone ([\d.]+)/.test(c)
        },
        iOSVersion: function() {
            var a = /OS (\d+)_(\d+)/.exec(c);
            return a ? [Number(a[1]), Number(a[2])] : []
        },
        appleWebkitVersion: function() {
            var a = c.match(/ applewebkit\/([0-9.]+)/i);
            return a ? a[1].split(".").map(parseFloat) : []
        },
        baiduBoxVersion: function() {
            if (!this.isBaiduBox())
                return 0;
            var a, h = /([\d+.]+)_(?:diordna|enohpi)_/i, b = /baiduboxapp\/([\d+.]+)/i;
            return h.test(c) ? a = c.match(h)[1].split(".").reverse() : b.test(c) && (a = c.match(b)[1].split(".")),
                a ? a.map(parseFloat) : []
        },
        secrVersion: function() {
            if (!this.isSearchCraft())
                return 0;
            var a = c.match(/ SearchCraft\/([0-9]+_)?([0-9.]+)/i)
                , h = a[2].split(/(iPhone|iPod|iPad)/.test(c) ? "." : ".");
            return h ? h.map(parseFloat) : []
        },
        getChromeVersion: function() {
            if (!this.isChromeDesktop() && !this.isChromeMobile())
                return 0;
            var a = c.match(/ Chrome\/([0-9]+_)?([0-9.]+)/i);
            return a && a[2] ? a[2].split(".").map(parseFloat) : []
        },
        androidVersion: function() {
            var a = c.match(/Android ([0-9.]+);/);
            if (!a)
                return [];
            var h = a[1].split(".").map(parseFloat);
            return h
        },
        isBaiduBox: function() {
            return /baiduboxapp/.test(c)
        },
        isBaiduBoxLite: function() {
            return /lite baiduboxapp/.test(c)
        },
        isBaiduBoxJisu: function() {
            return mod.isAndroid() && /lite baiduboxapp/.test(c) || mod.isIOS() && /info baiduboxapp/.test(c)
        },
        isQQ: function() {
            return /QQBrowser/.test(c)
        },
        isQQApp: function() {
            return /QQ\/[0-9]+/.test(c)
        },
        isWeixinApp: function() {
            return /MicroMessenger/.test(c)
        },
        isQQBrowser: function() {
            return /QQBrowser/.test(c) && !(/QQ\//.test(c) || /MicroMessenger/.test(c))
        },
        isBaiduBrowser: function() {
            return /baidubrowser/.test(c)
        },
        isSearchCraft: function() {
            return /SearchCraft/i.test(c)
        },
        isUC: function() {
            return /UCBrowser/.test(c)
        },
        isChromeDesktop: function() {
            return /Chrome\//.test(c)
        },
        isChromeMobile: function() {
            return /Chrome\/(\S*) Mobile/.test(c)
        },
        isCriOS: function() {
            return /CriOS/.test(c)
        },
        isSogouMobile: function() {
            return /SogouMobileBrowser/.test(c)
        },
        isMiuiBrowser: function() {
            return /MiuiBrowser\/(\S*)/.test(c)
        },
        isHUAWEIBrowser: function() {
            return /HUAWEI/i.test(c) && !(/baiduboxapp/.test(c) || /QQBrowser/.test(c) || /UCBrowser/.test(c) || /MicroMessenger/.test(c))
        },
        isMZBrowser: function() {
            return /MZBrowser/i.test(c)
        },
        isWKWebview: function() {
            var a = mod.appleWebkitVersion();
            return mod.isIOS() && a[0] && a[0] > 600
        },
        isUIWebview: function() {
            var a = mod.appleWebkitVersion();
            return mod.isIOS() && a[0] && a[0] <= 600
        },
        use: a
    };
    return mod
}




