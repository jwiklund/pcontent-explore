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
    function finalResult(validForId, data) {
      if (validForId != id) {
        return;
      }
      $('#explorefound').css('display', 'block');
      $('#exploreresult').html('<pre><code>' + JSON.stringify(data, null, "  ") + '</code></pre>');
      $('#exploreresult pre code').each(function(i, e) { hljs.highlightBlock(e); });
    }
    function expandResult(validForId, dataType, topData, currentData, resultKey, count, newData) {
      if (validForId != id) {
        return;
      }
      if (resultKey) {
        currentData[resultKey] = newData;
      } else {
        topData = newData;
      }
      if (dataType == 'HangerId') {
        var get = 'HangerVersion::' + newData.key;
        $.ajax(base + get, $.extend({}, settings, {
          success: expandResult.bind(expandResult, validForId, 'HangerVersion', topData, newData, 'key :  ' + get, count),
          error: expandError.bind(expandError, validForId, topData, newData, 'key-' + newData.key, count)
        }));
      } else if (dataType == 'HangerVersion') {
        var get = 'Hanger::' + newData.contentId.key + "::" + newData.version;
        $.ajax(base + get, $.extend({}, settings, {
          success: expandResult.bind(expandResult, validForId, 'Hanger', topData, newData, 'version :  ' + get, count),
          error: expandError.bind(expandError, validForId, topData, newData, 'version-' + newData.version, count)
        }));
      } else if (dataType == 'Hanger') {
        var aspects = { count: 0 };
        for (var i in newData.aspectLocations) {
          aspects.count = aspects.count + 1;
        }
        for (var i in newData.aspectLocations) {
          var aspect = newData.aspectLocations[i];
          var get = 'AspectVersion::' + aspect.key;
          $.ajax(base + get, $.extend({}, settings, {
            success: expandResult.bind(expandResult, validForId, 'AspectVersion', topData, aspect, 'key :  ' + get, count),
            error: expandError(expandError, validForId, topData, aspect, 'key :  ' + aspect.key, count)
          }))
        }
      } else if (dataType == 'AspectVersion') {
        var get = 'Aspect::' + newData.contentId.key + '::' + newData.version;
        $.ajax(base + get, $.extend({}, settings, {
          success: expandResult.bind(expandResult, validForId, 'Aspect', topData, newData, 'version : ' + get, count),
          error: expandError.bind(expandError, validForId, topData, newData, 'version-' + newData.version, count)
        }));
      } else {
        if (count) {
          count.count = count.count - 1;
          if (count.count == 0) {
            finalResult(validForId, topData);
          }
        } else {
          finalResult(validForId, topData);
        }
      }
    }
    function expandError(validForId, topData, currentData, resultKey, count, jqXHR, textStatus) {
      if (validForId != id) {
        return;
      }
      currentData[resultKey] = 'not found';
      if (count) {
        count.count = count.count - 1;
        if (count.count == 0) {
          finalResult(validForId, topData);
        }
      } else {
        finalResult(validForId, topData);
      }
    }
    function typeFromId(id) {
      if (id.indexOf('::') == -1) {
        return 'unknown';
      }
      return id.substring(0, id.indexOf('::'));
    }
    function updateSearch(searchFor) {
      $.ajax(base + searchFor, $.extend({}, settings, {
        success: expandResult.bind(expandResult, searchFor, typeFromId(searchFor), null, null, null, null),
        error: function(jqXHR) {
          if (searchFor == id) {
            $.ajax(base + 'HangerId::' + searchFor, $.extend({}, settings, {
              success: expandResult.bind(expandResult, searchFor, 'HangerId', null, null, null, null),
              error: function(jqXHR) {
                if (searchFor == id) {
                  $.ajax(base + 'HangerVersion::' + searchFor, $.extend({}, settings, {
                    success: expandResult.bind(expandResult, searchFor, 'HangerVersion', null, null, null, null),
                    error: function(jqXHR) {
                      if (searchFor == id) {
                        $.ajax(base + 'AspectVersion::' + searchFor, $.extend({}, settings, {
                          success: expandResult.bind(expandResult, searchFor, 'AspectVersion', null, null, null, null),
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
              }
            }));
          }
        }
      }));
    }
    function changeDetect() {
      var nid = idelement.val();
      if (nid != id) {
        id = nid;
        updateSearch(id);
      }
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