/**
 * Created by Goga- on 08-Jun-17.
 */
var ipc = require('electron').ipcRenderer;
var shell = require('electron').shell;
const cfg = require('./cfg');
$(function () {
    ipc.send('domReady');
    //open links externally by default
    $(document).on('click', 'a[href^="http"]', function(event) {
        event.preventDefault();
        shell.openExternal(this.href);
    });
    ipc.send('checkLogin');
    ipc.on('checkLoginResponse', (event, response) => {
        if(response){
            $('#jira-username').text(response);
            $('#jira').show(300, function () {
                $('#jira').showPreloader();
                ipc.send('loadIssues');
            });
        }else{
            $('#jira-login').show();
        }
    });
    ipc.on('screenshotsLoaded', (event, response) => {
        $('#screenshots').showPreloader();
        $('#screenshots').html('');
        console.log('WORKLOG LOADED',response);
        if(response && response.worklogs){
            let worklogs = response.worklogs;
            for(var i in worklogs) {
                let worklog = worklogs[i];
                let text = worklog.comment;
                if(typeof text == "undefined") continue;
                let regex = /(([\w\d\s]+)\\{2})|!(.*\.png)(\|.*!)|(hash:{(.*)})/g;
                let result = text.split(regex);

                let comment = (result && result[2])?result[2]:'';
                let img = (result && result[10])?result[10]:'';
                let sn = (result && result[20])?result[20]:'';

                $('#screenshots').prepend('<div class="col-3 mb-2"><div class="tracker-screenshot '+(!!worklog.confirmed?'bg-success':'bg-danger')+'">' +
                    '<a class="" data-fancybox="gallery" title="'+sn+'" data-fancybox="images" data-src="' + img + '" href="javascript:;">' +
                    '<img class="img-fluid" src="' + img + '">' +
                    '</a>' +
                    '<p class="mb-0"><small>'+ comment +'</small></p>' +
                    '<strong>Time: </strong>'+ worklog.timeSpent +
                    '</div></div>');

            }
        }
    });
    ipc.on('loginSuccess', (event, response) => {
        $('body').showPreloader();
        $('#jira-login').hide();
        $('#jira-username').text(response.username);
        $('#logout').show();
        $('#jira').show(300, function () {
            $('#jira').showPreloader();
            ipc.send('loadIssues');
        });
    });
    ipc.on('loginFailed', (event, response) => {
        $('body').showPreloader();
        $('#jira-login').show().find('input[name="username"]').val(response.username);
        showAlert('Error','Login failed!','danger');
    });
    ipc.on('issuesLoaded', (event, response) => {
        console.log('ISSUES LOADED',response);
        var issues = response.result.issues;
        $(this).showPreloader();
        if(response.filters) {
            $('#jira-filters-form .jira-filter-type').prop('checked', false);
            $('#jira-filters-form .jira-filter-type[value="'+response.filters.filterType+'"]').prop('checked', true);
            if(response.filters.jql) {
                $('#jira-filters-form #jira-jql').val(response.filters.jql);
            }
        }
        $('#jira-issues').show().html('');
        if(issues.length > 0) {
            $('#issues-count').text('Count: ' + issues.length);
            for (var i in issues) {
                var issue = issues[i]
                var output = Mustache.render(templates.issue, issue);
                $('#jira-issues').append(output);
            }
        }else{
            $('#issues-count').text('Count: 0');
            showAlert('Empty!', 'No issues found.', 'warning');
        }
    });
    ipc.on('statusesLoaded', (event, response) => {
        updateFilter('status', response);
    });
    ipc.on('prioritiesLoaded', (event, response) => {
        updateFilter('priority', response);
    });
    ipc.on('projectsLoaded', (event, response) => {
        updateFilter('project', response);
    });
    ipc.on('trackerSwitched', (event, response) => {
        response = !!response;
        if(!response){
            $('#stop').hide();
            $('#start').show();
        }else{
            $('#stop').show();
            $('#start').hide();
        }
    });
    if(cfg.debug) {
        $('#back-to-issues').after('<button class="btn btn-danger" id="jira-remove-worklogs">Remove Worklogs</button>');
        $('#tracker').on('click', '#jira-remove-worklogs', function () {
            ipc.send('removeWorklogs');
        });
    }
    $('#logout').on('click', function () {
        ipc.send('logoutLogout');
        $('#jira-filters-form select').val('');
        $('#jira').hide();
        $('#jira-issues').html('');
        $('#jira-username').text('');
        $('#logout').hide();
        $('#tracker').hide();
        $('#jira-login').show();
    });
    $('#start').on('click', function(){
        $(this).hide();
        $('#stop').show();
        ipc.send('startTracking', 'someData');
    });
    $('#stop').on('click', function(){
        $(this).hide();
        $('#start').show();
        ipc.send('stopTracking', 'someData');
    });
    $('#jira-login').on('submit', function (e) {
        e.preventDefault();
        var form = $(this);
        $('body').showPreloader();
        var data = {
            username: form.find('input[name="username"]').val(),
            password: form.find('input[name="password"]').val(),
        }
        ipc.send('loginRequest', data);
    })
    $('#jira-filters-form').on('submit', function (e) {
        e.preventDefault();
        var form = $(this);
        form.find('select').prop('disabled', true);
        var data = {
            project: form.find('#jira-filters-project').val(),
            status: form.find('#jira-filters-status').val(),
            priority: form.find('#jira-filters-priority').val(),
            jql: form.find('#jira-jql').val(),
            filterType: $('.jira-filter-type:checked').val()
        }
        $('#jira').showPreloader();
        ipc.send('loadIssues', data);
    });
    $('#jira-issues').on('click', '.select-this-issue', function () {
        $('#jira-issues').hide();
        $('#jira').hide();
        ipc.send('issueSelected', $(this).data('key'));
        $('#current-issue').text($(this).data('key'));
        $('#tracker').show();
        $('#screenshots').showPreloader();
    });
    $('#back-to-issues').on('click', function () {
        ipc.send('stopTracking');
        $('#jira').show();
        $('#jira-issues').show();
        $('#current-issue').text('');
        $('#tracker').hide();
    });
    $('#tracker-comment').on('change', function () {
        ipc.send('commentChanged', $(this).val());
    })
});

function updateFilter(name, response) {
    var form = $('#jira-filters');
    var filter = form.find('#jira-filters-' + name);
    var current_value = filter.val();
    if(!current_value && response.filters && response.filters[name]) current_value = response.filters[name];
    console.log(name.toUpperCase() + ' LOADED', response);
    var output = Mustache.render(templates.filter, {objects: response.result, name: name});
    filter.html('').append(output).prop('disabled', false);
    filter.val(current_value).trigger('change');
}

function showAlert(title, message, type = 'info') {
    var output = Mustache.render(templates.alertMessage, {type: type, title: title, message: message});
    $('#alerts-holder').append(output);
}

$.fn.showPreloader = function() {
    if($(this).find('.preloader').length) $(this).find('.preloader').remove();
    else $(this).append(templates.preloader);
};