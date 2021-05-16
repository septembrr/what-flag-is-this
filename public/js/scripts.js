$(document).ready(function(){
    $("#country-info").accordion({
        active: false,
        animate: 200,
        collapsible: true,
        header: 'button',
        icons: {
            header: 'ui-icon-caret-1-s',
            activeHeader: 'ui-icon-caret-1-n',
        }
    });
});