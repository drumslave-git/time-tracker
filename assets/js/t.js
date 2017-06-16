/**
 * Created by Goga- on 09-Jun-17.
 */
const templates = {
    issue:  '<div class="card issue"> \
                <div class="card-header">\
                    <strong>{{key}}</strong> {{fields.status.name}}\
                </div>\
                <div class="card-block">\
                    <div class="card-title">{{fields.summary}}</div>\
                </div>\
                <ul class="list-group list-group-flush">\
                    <li class="list-group-item">{{fields.project.name}}</li>\
                    <li class="list-group-item">{{fields.priority.name}}</li>\
                </ul>\
                <div class="card-block">\
                <button class="btn btn-primary select-this-issue" data-key="{{key}}">Select</button>\
                    <a target="_blank" href="{{self}}" class="card-link">Issue link</a>\
                </div>\
                <div class="card-footer text-muted">\
                    by {{fields.creator.name}}\
                </div>\
            </div>',
    filter: '<option value="">{{name}}</option> \
            {{#objects}}\
                <option value="{{id}}">{{name}}</option>\
            {{/objects}}',
    alertMessage:   '<div class="alert mb-0 alert-{{type}} alert-dismissible fade show" role="alert">\
                        <button type="button" class="close" data-dismiss="alert" aria-label="Close">\
                            <span aria-hidden="true">&times;</span>\
                        </button>\
                        <strong>{{{title}}}</strong> {{{message}}}\
                    </div>',
    preloader: '<div class="preloader"><div class="cssload-loader-inner">\
                    <div class="cssload-cssload-loader-line-wrap-wrap">\
                        <div class="cssload-loader-line-wrap"></div>\
                    </div>\
                    <div class="cssload-cssload-loader-line-wrap-wrap">\
                        <div class="cssload-loader-line-wrap"></div>\
                    </div>\
                    <div class="cssload-cssload-loader-line-wrap-wrap">\
                        <div class="cssload-loader-line-wrap"></div>\
                    </div>\
                    <div class="cssload-cssload-loader-line-wrap-wrap">\
                        <div class="cssload-loader-line-wrap"></div>\
                    </div>\
                    <div class="cssload-cssload-loader-line-wrap-wrap">\
                        <div class="cssload-loader-line-wrap"></div>\
                    </div>\
                </div></div>'
};