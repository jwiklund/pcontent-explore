var explore = function(window, $) {
  var base = 'cb/', id = '', settings = {
    cache: false,
    dataType: 'json'
  };
  $('#exploreresult').on('click', '.link', function(e) {
    if (e.ctrlKey) {
      return;
    }
    $('#exploreid').val($(e.target).text());
    $('#exploreid').change();
    e.preventDefault();
  });
  $('.createview').on('click', function(e) {
    $.ajax(base + 'view', $.extend({}, {method: 'POST', data: '{"operation":"create"}', contentType: 'application/json' }, settings))
      .done(function() {
        $('#explorelist').css('display', 'none');
      })
      .fail(function() {
        console.log('Create ids view failed');
      });
    e.preventDefault();
  });
  
  function finalResult(validForId, data) {
    if (validForId != id) {
      return;
    }
    $('#explorefound').css('display', 'block');
    $('#exploreresult').html('<pre><code>' + JSON.stringify(data, null, "  ") + '</code></pre>');
    $('#exploreresult pre code').each(function(i, e) { hljs.highlightBlock(e); });
    var url = document.location.href;
    if (url.indexOf('#') != -1) {
      url = url.substring(0, url.indexOf('#'));
    }
    document.location = url + '#key=' + validForId;
  }
  function expandResult(validForId, dataType, topData, currentData, resultKey, count, resultData) {
    if (validForId != id) {
      return;
    }
    var newData = resultData.data;
    if (dataType == null) {
      dataType = typeFromId(resultData.id);
    }
    newData = $.extend({}, {'_InternalId': resultData.id}, newData);
    if (resultKey) {
      currentData[resultKey] = newData;
    } else {
      topData = newData;
    }
    if (dataType == 'HangerId') {
      var get = 'HangerVersion::' + newData.key;
      $.ajax(base + get, settings)
        .done(expandResult.bind(expandResult, validForId, 'HangerVersion', topData, newData, 'key :  ' + newData.key, count))
        .fail(expandError.bind(expandError, validForId, topData, newData, 'key-' + newData.key, count));
    } else if (dataType == 'HangerVersion') {
      var get = 'Hanger::' + newData.contentId.key + "::" + newData.version;
      $.ajax(base + get, settings)
        .done(expandResult.bind(expandResult, validForId, 'Hanger', topData, newData, 'version :  ' + newData.version, count))
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
          .done(expandResult.bind(expandResult, validForId, 'AspectVersion', topData, aspect, 'key :  ' + aspect.key, count))
          .fail(expandError.bind(expandError, validForId, topData, aspect, 'key :  ' + aspect.key, count));
      }
    } else if (dataType == 'AspectVersion') {
      var get = 'Aspect::' + newData.contentId.key + '::' + newData.version;
      $.ajax(base + get, settings)
        .done(expandResult.bind(expandResult, validForId, 'Aspect', topData, newData, 'version : ' + newData.version, count))
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
  function search(searchFor) {
    if (searchFor != id) {
      return;
    }
    $('#explorefound').css('display', 'none');
    var searchUrl = base + 'search/ids?key=' + searchFor + '&key=HangerId::' + searchFor + '&key=HangerVersion::' + searchFor + '&key=AspectVersion::' + searchFor;
    $.ajax(searchUrl, settings)
      .done(function(found) {
        if (searchFor != id) {
          return;
        }
        if (found.length == 1) {
          $('#exploreid').val(found[0]);
          $('#exploreid').change();
        } else if (found.length > 0) {
          $('#exploreresult').css('display', 'block');
          $('#exploreresult').html('<ul>' + found.map(function(id) { return '<li><a href="#key=' + id + '" class="link">' + id + '</a></li>'; }).join('\n') + '</ul>');
        }
      })
      .fail(function() {
        $('#explorelist').css('display', 'block');
      }
    );
  }
  function typeFromId(id) {
    if (id.indexOf('::') == -1) {
      return 'unknown';
    }
    return id.substring(0, id.indexOf('::'));
  }
  function updateSearch(searchFor) {
    if (searchFor != id) {
      return;
    }
    $('#explorefound').css('display', 'none');
    var findUrl = base + searchFor;
    $.ajax(findUrl, settings)
      .done(expandResult.bind(expandResult, searchFor, null, null, null, null, null))
      .fail(search.bind(search, searchFor));
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
  // check for #key= argument
  function hashKey() {
    var hash = document.location.hash;
    var ind = hash.indexOf('key=');
    if (ind == -1) {
      return '';
    }
    var end = hash.indexOf('=', ind + 4);
    if (end == -1) {
      end = hash.length;
    }
    return hash.substring(ind + 4, end);
  }
  $('#exploreid').val(hashKey()).change();
}
