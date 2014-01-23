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
    };
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
      newData = $.extend({}, {'_InternalPrefixType': dataType}, newData);
      if (resultKey) {
        currentData[resultKey] = newData;
      } else {
        topData = newData;
      }
      if (dataType == 'HangerId') {
        var get = 'HangerVersion::' + newData.key;
        $.ajax(base + get, settings)
          .done(expandResult.bind(expandResult, validForId, 'HangerVersion', topData, newData, 'key :  ' + get, count))
          .fail(expandError.bind(expandError, validForId, topData, newData, 'key-' + newData.key, count));
      } else if (dataType == 'HangerVersion') {
        var get = 'Hanger::' + newData.contentId.key + "::" + newData.version;
        $.ajax(base + get, settings)
          .done(expandResult.bind(expandResult, validForId, 'Hanger', topData, newData, 'version :  ' + get, count))
          .fail(expandError.bind(expandError, validForId, topData, newData, 'version-' + newData.version, count));
      } else if (dataType == 'Hanger') {
        var aspects = { count: 0 };
        for (var i in newData.aspectLocations) {
          aspects.count = aspects.count + 1;
        }
        for (var i in newData.aspectLocations) {
          var aspect = newData.aspectLocations[i];
          var get = 'AspectVersion::' + aspect.key;
          $.ajax(base + get, settings)
            .done(expandResult.bind(expandResult, validForId, 'AspectVersion', topData, aspect, 'key :  ' + get, count))
            .fail(expandError.bind(expandError, validForId, topData, aspect, 'key :  ' + aspect.key, count));
        }
      } else if (dataType == 'AspectVersion') {
        var get = 'Aspect::' + newData.contentId.key + '::' + newData.version;
        $.ajax(base + get, settings)
          .done(expandResult.bind(expandResult, validForId, 'Aspect', topData, newData, 'version : ' + get, count))
          .fail(expandError.bind(expandError, validForId, topData, newData, 'version-' + newData.version, count));
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
      function search(type, first, types) {
        if (searchFor != id) {
          return;
        }
        var theId = searchFor;
        if (!first) {
          theId = type + '::' + theId;
        }
        var jqXHR = $.ajax(base + theId, settings)
          .done(expandResult.bind(expandResult, searchFor, type, null, null, null, null))
        if (types.length > 0) {
          var next = types[0];
          var left = types.splice(1);
          jqXHR.fail(search.bind(search, next, false, left));
        } else {
          jqXHR.fail(function() {
            if (searchFor == id) {
              $('#explorefound').css('display', 'none');
            }
          });
        }
      }
      search(typeFromId(searchFor), true, ['HangerId', 'HangerVersion', 'AspectVersion']);
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
    $.ajax(base + 'doesnotexist', {
      cache: false,
      dataType: 'json',
      username: details.user,
      password: details.pass
    }).done(function(data) {
        $.cookie('explore.cookie', btoa(JSON.stringify(details)));
        initExplore(details);
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
        if (jqXHR.status == 404) {
          $.cookie('explore.cookie', btoa(JSON.stringify(details)));
          initExplore(details);
        }
      });
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