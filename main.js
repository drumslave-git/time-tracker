/**
 * Created by Goga- on 08-Jun-17.
 * @TODO Add watermark for screenshots
 * @TODO Handle errors
 * @TODO Handle async screenshots upload (when offline during tracking)
 * @TODO Create server clearing server (remove unneeded imgs)
 * @TODO Fix screenshot start time
 */
const debug = true;
const {app, BrowserWindow, Tray, Menu} = require('electron');
const path = require('path');
const url = require('url');
const screenshot = require('desktop-screenshot');
const fs = require('fs');
const notifier = require('node-notifier');
const moment = require('moment');
const ipc = require('electron').ipcMain;
const UserData = require('./userdata.js');

let win;
let tray = null
let screenshots_active = false;
let currentTrackingSessionId = null;
let currentScreenshot = null;
const Jira = require('./jira.js');

const userdata = new UserData({
    configName: 'tracker-preferences',
    defaults: {
        user: {username:'', password:'',
            trackingSessions:{},
            currentTrackingSessionId: null,
            filters:""
        },
        windowBounds: { width: 800, height: 600 },
    }
});

fs.mkdir(path.join(__dirname, 'screenshots'), function () {});

function createWindow() {
    let { width, height } = userdata.get('windowBounds');
    win = new BrowserWindow({width: width, height: height, icon: path.join(__dirname, 'assets/imgs/1496949938_hourglass.png')});
    if(!debug) win.setMenu(null);
    win.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }))

    if(debug) win.webContents.openDevTools({mode:'undocked'});

    tray = new Tray( path.join(__dirname, 'assets/imgs/1496949938_hourglass.png'));
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Show App', click:  function(){
            win.show();
        } },
        {label: 'Start', click:  function(){
            switchTracker(true);
        }},
        {label: 'Stop', click:  function(){
            switchTracker(false);
        }},
        { label: 'Quit', click:  function(){
            app.isQuiting = true;
            switchTracker(false);
            app.quit();
        } }
    ]);
    tray.setToolTip('WhaleSoft Time Tracker');
    tray.setContextMenu(contextMenu);

    tray.on('double-click', function () {
        win.show();
    });
    win.on('resize', () => {
        // The event doesn't pass us the window size, so we call the `getBounds` method which returns an object with
        // the height, width, and x and y coordinates.
        let { width, height } = win.getBounds();
        // Now that we have them, save them using the `set` method.
        userdata.set('windowBounds', { width, height });
    });
    win.on('close', function (event) {
        if( !app.isQuiting){
            event.preventDefault()
            win.hide();
        }
        return false;
    });
    win.on('minimize',function(event){
        event.preventDefault();
        win.hide();
    });
}
function switchTracker(on) {
    if (screenshots_active === on){
        notifier.notify({
            'title': 'WhaleSoft Time Tracker',
            'message': 'Already!',
            'wait': false
        })
        return;
    }
    screenshots_active = on;
    var user = userdata.get('user');
    if(on) {
        tray.setImage(path.join(__dirname, 'assets/imgs/1496949940_challenge.png'));
        win.setIcon(path.join(__dirname, 'assets/imgs/1496949940_challenge.png'));
        if(!currentTrackingSessionId){
            currentTrackingSessionId = user['currentTrackingSessionId'];
            if(!currentTrackingSessionId){
                currentTrackingSessionId = 'session-'+(Date.now() / 1000 | 0);
                var session = {
                    id: currentTrackingSessionId,
                    start: (Date.now() / 1000 | 0),
                    jiraStart: moment().format('YYYY-MM-DDThh:mm:ss.sTZD'),
                    issue: Jira.trackingIssue,
                    end: null,
                    screenshots: {}
                }
                user['currentTrackingSessionId'] = currentTrackingSessionId;
                userdata.set('user', user);
                setSession(currentTrackingSessionId, session);
            }
        }
        takeScrennshot("Time tracking for issue " + Jira.trackingIssue + " is started!");
    }else{
        tray.setImage(path.join(__dirname, 'assets/imgs/1496949938_hourglass.png'));
        win.setIcon(path.join(__dirname, 'assets/imgs/1496949938_hourglass.png'));
        var currentSession = getSession(currentTrackingSessionId);
        currentSession.end = (Date.now() / 1000 | 0);
        setSession(currentTrackingSessionId, currentSession);
        currentTrackingSessionId = null;
        user['currentTrackingSessionId'] = null;
        userdata.set('user', user);
        takeScrennshot("Time tracking for issue " + Jira.trackingIssue + " is stopped!");
    }
}
function getSession(id = null){
    var user = userdata.get('user');
    var sessions = user.trackingSessions;
    if(id) return sessions[id];
    else return sessions;
}
function setSession(id, session){
    var user = userdata.get('user');
    var sessions = user.trackingSessions;
    sessions[id] = session;
    userdata.set('user', user);
    return true;
}
function takeScrennshot(msg) {
    let screenshot_time = (Date.now() / 1000 | 0);
    let screenshot_jira_time = moment().format('YYYY-MM-DDThh:mm:ss.sTZD');
    let screenshot_name = 'screenshot-' + screenshot_time + '.png';
    let screenshot_path = path.join(__dirname, 'screenshots/' + screenshot_name);
    let session = getSession(currentTrackingSessionId);
    let screenshot_duration = screenshot_time - session.start;
    if(session.lastScreenshotTime) screenshot_duration = screenshot_time - session.lastScreenshotTime;
    let screenshot_start = session.jiraStart;
    if(session.lastScreenshotJiraTime) screenshot_start = session.lastScreenshotJiraTime;

    if(debug) console.log(screenshot_path);
    screenshot(screenshot_path, {width: 800}, function(error, complete) {
        if(error) {
            console.log("Screenshot failed", error);
        }else {
            if(debug) console.log("Screenshot succeeded");
            currentScreenshot = {
                name: screenshot_name,
                path: screenshot_path,
                time: screenshot_time,
                jiraTime: screenshot_jira_time,
                start: screenshot_start,
                duration: screenshot_duration,
                status: 'new'
            };

            // loadScreenshots();

            notifier.notify({
                'title': 'WhaleSoft Time Tracker',
                'message': msg,
                'icon': screenshot_path,
                'wait': true
            }, function (err, response) {
            });
            // Jira.addComment(message);
            setTimeout(function () {
                if(screenshots_active) {
                    let message = 'Screenshot for issue ' + Jira.trackingIssue + ' captured!' + ' \nClick this message to remove this one.';
                    takeScrennshot(message);
                }
            }, getRandomInt(60000, 300000))


        }
    });
}
function loadScreenshots() {
    /*fs.readdir(path.join(__dirname, 'screenshots/'), function (err, files) {
        // console.log('FILES');
        // console.log(files);
        for(var i in files){
            files[i] = path.join(__dirname, 'screenshots/' + files[i]);
        }
        win.webContents.send('screenshotsLoaded', files);
    });*/
    Jira.getWorklog(function (resp) {
        // if(debug) console.log('WorkLog loaded', resp);
        win.webContents.send('screenshotsLoaded', resp);
    })
}
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
   if(process.platform !== 'darwin'){
       app.quit();
   }
});

app.on('activate', () => {
    if(win === null){
        createWindow();
    }
});

ipc.on('domReady', function(event, data){
    // loadScreenshots();
});
ipc.on('startTracking', function(event, data){
    switchTracker(true);
    // event.sender.send('actionReply', result);
});
ipc.on('stopTracking', function(event, data){
    switchTracker(false);
});
ipc.on('checkLogin', function(event, data){
    let user = userdata.get('user');
    if(debug) console.log(user);
    if(Jira.session)
        win.webContents.send('checkLoginResponse', Jira.username);
    else {
        if(user && user.username && user.password){
            Jira.login(user.username, user.password, function () {
                win.webContents.send('loginSuccess', user.username);
            });
        }
        else {
            win.webContents.send('checkLoginResponse');
        }
    }
});
ipc.on('loginRequest', function(event, data){
    let user = userdata.get('user');
    if(debug && (!data.username || !data.password)){
        data = {username: 'admin', password: 'Th1515Sparta!\\./!'};
    }
    Jira.login(data.username, data.password, function () {
        user.username =  data.username;
        user.password =  data.password;
        userdata.set('user', user);
        win.webContents.send('loginSuccess', {username: data.username, filters: data.filters});
    });
});
ipc.on('logoutRequest', function(event, data){
    switchTracker(false);
    Jira.trackingIssue = null;
    Jira.session = null;
});
ipc.on('issueSelected', function(event, data){
    Jira.trackingIssue = data;
    loadScreenshots();
});
ipc.on('commentChanged', function(event, data){
    Jira.trackingComment = data;
});
ipc.on('loadIssues', function(event, data = false){
    let user = userdata.get('user');
    if(!data) data = user['filters'];
    var jql = "assignee="+Jira.username;
    if(data) {
        if(data.filterType == 0) {
            if (data.project) jql += ' and project=' + data.project;
            if (data.status) jql += ' and status=' + data.status;
            if (data.priority) jql += ' and priority=' + data.priority;
        }else{
            jql += ' and ' + data.jql;
        }
    }
    user['filters'] = data;
    userdata.set('user', user);
    Jira.getIssues(jql, function (result) {
        let user = userdata.get('user');
        win.webContents.send('issuesLoaded', {result:result, filters: user.filters});
    });
    Jira.getStatuses(function (result) {
        let user = userdata.get('user');
        win.webContents.send('statusesLoaded', {result:result, filters: user.filters});
    });
    Jira.getPriorities(function (result) {
        let user = userdata.get('user');
        win.webContents.send('prioritiesLoaded', {result:result, filters: user.filters});
    });
    Jira.getProjects(function (result) {
        let user = userdata.get('user');
        win.webContents.send('projectsLoaded', {result:result, filters: user.filters});
    });
});

notifier.on('click', function (notifierObject, options) {
    if(!currentTrackingSessionId) return;
    console.log('Notification click');
    var screenshot = options.icon;
    fs.unlink(screenshot, function (err) {
        loadScreenshots();
        var currentSession = getSession(currentTrackingSessionId);
        currentScreenshot.status = 'removed';
        currentSession.screenshots[currentScreenshot.time] = currentScreenshot;
        currentSession.lastScreenshotTime = currentScreenshot.time;
        currentSession.lastScreenshotJiraTime = currentScreenshot.jiraTime;
        Jira.addWorkLog(currentScreenshot, function (resp) {
            loadScreenshots();
        });
        setSession(currentSession);

        if(debug) console.log('Screenshot removed');
    });
    // console.log(options);
});

notifier.on('timeout', function (notifierObject, options) {
    if(!currentTrackingSessionId) return;
    if(debug) console.log('Notification timeout');
    var currentSession = getSession(currentTrackingSessionId);
    currentSession.screenshots[currentScreenshot.time] = currentScreenshot;
    currentSession.lastScreenshotTime = currentScreenshot.time;
    currentSession.lastScreenshotJiraTime = currentScreenshot.jiraTime;
    Jira.addWorkLog(currentScreenshot, function (resp) {
        loadScreenshots();
    });
    setSession(currentSession);
});
