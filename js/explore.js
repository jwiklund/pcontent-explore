var explore = function(window, $) {
  var base = '/couchbase/couchBase/cmbucket/';
  function initExplore(details) {
    $('#login').css('display', 'none');
    $('#explore').css('display', 'block');
    var id = '', settings = {
      cache: false,
      dataType: 'json',
      username: details.user,
      password: details.pass
    }
    function changeDetect() {
      var nid = idelement.val();
      if (nid != id) {
        id = nid;
        updateSearch(id);
      }
    }
    function updateSearch(searchFor) {
      $.ajax(base + searchFor, $.extend({}, settings, {
        success: function(data) {
          if (searchFor == id) {
            $('#exploreresult').text(JSON.stringify(data, null, "  "));
            $('#explorefound').css('display', 'block');
          }
        },
        error: function(jqXHR) {
          if (searchFor == id) {
            $.ajax(base + 'HangerId::' + searchFor, $.extend({}, settings, {
              success: function(data) {
                if (searchFor == id) {
                  $('#exploreresult').text(JSON.stringify(data, null, "  "));
                  $('#explorefound').css('display', 'block');
                }
              },
              error: function(jqXHR) {
                if (searchFor == id) {
                  $('#explorefound').css('display', 'none');
                }            
              }
            }));
          }
        }
      }));
    }
    var idelement = $('#exploreid');
    idelement.keyup(changeDetect);
    idelement.change(changeDetect);
    $('#exploreid').keydown(function() {
      var now = $('#exploreid')
    });
  }
  function ping(details, success) {
    $.ajax(base + 'doesnotexist', $.extend({}, settings, {
      success: function(data) {
        $.cookie('explore.cookie', btoa(JSON.stringify(details)));
        initExplore(details);
      },
      error: function(jqXHR, textStatus, errorThrown) {
        if (jqXHR.status == 404) {
          $.cookie('explore.cookie', btoa(JSON.stringify(details)));
          initExplore(details);
        }
      }
    }));
  }

  var details = $.cookie("explore.cookie");
  if (!details) {
    $('#login').css('display', 'block');
    $('#login button').click(function(event) {
      event.preventDefault();
      details = {
        user: $('#user').val(),
        pass: $('#pass').val()
      }
      ping(details, initExplore.bind(details));
    });
  } else {
    initExplore(JSON.parse(atob(details)));
  }
}