var explore = function(window, $) {
  var base = 'cb/';
  function initExplore() {
    $('#exploreresult').on('click', '.link', function(e) {
      if (e.ctrlKey) {
        return;
      }
      $('#exploreid').val($(e.target).text());
      $('#exploreid').change();
      e.preventDefault();
    });
    $('.createview').on('click', function(e) {
      var doc = {
        'views': {
          'ids': {
            'map': 'function (doc, meta) { emit(meta.id.toLowerCase(), null); }'
          }
        }
      };
      $.ajax(base + '_design_slash_ids', $.extend({}, {method: 'PUT', data: JSON.stringify(doc), contentType: 'application/json' }, settings))
        .done(function() {
          $('#explorelist').css('display', 'none');
        })
        .fail(function() {
          console.log('Create ids view failed');
        });
      e.preventDefault();
    });
    var id = '', settings = {
      cache: false,
      dataType: 'json'
    };
    function finalResult(validForId, data) {
      if (validForId != id) {
        return;
      }
      $('#explorefound').css('display', 'block');
      $('#exploreresult').html('<pre><code>' + JSON.stringify(data, null, "  ") + '</code></pre>');
      $('#exploreresult pre code').each(function(i, e) { hljs.highlightBlock(e); });
    }
    function expandResult(validForId, dataType, topData, currentData, resultKey, resultId, count, newData) {
      if (validForId != id) {
        return;
      }
      newData = $.extend({}, {'_InternalId': resultId}, newData);
      if (resultKey) {
        currentData[resultKey] = newData;
      } else {
        topData = newData;
      }
      if (dataType == 'HangerId') {
        var get = 'HangerVersion::' + newData.key;
        $.ajax(base + get, settings)
          .done(expandResult.bind(expandResult, validForId, 'HangerVersion', topData, newData, 'key :  ' + newData.key, get, count))
          .fail(expandError.bind(expandError, validForId, topData, newData, 'key-' + newData.key, count));
      } else if (dataType == 'HangerVersion') {
        var get = 'Hanger::' + newData.contentId.key + "::" + newData.version;
        $.ajax(base + get, settings)
          .done(expandResult.bind(expandResult, validForId, 'Hanger', topData, newData, 'version :  ' + newData.version, get, count))
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
            .done(expandResult.bind(expandResult, validForId, 'AspectVersion', topData, aspect, 'key :  ' + aspect.key, get, count))
            .fail(expandError.bind(expandError, validForId, topData, aspect, 'key :  ' + aspect.key, count));
        }
      } else if (dataType == 'AspectVersion') {
        var get = 'Aspect::' + newData.contentId.key + '::' + newData.version;
        $.ajax(base + get, settings)
          .done(expandResult.bind(expandResult, validForId, 'Aspect', topData, newData, 'version : ' + newData.version, get, count))
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
      function listids(searchFor, types) {
        if (searchFor != id) {
          return;
        }
        $('#explorefound').css('display', 'none');

        var type = types[0];
        var left = types.splice(1);
        var theId = searchFor.toLowerCase();
        if (type != '') {
          theId = type.toLowerCase() + '::' + theId;
        }
        $.ajax(base + 'search/ids?key' + theId, settings)
          .done(function(data) {
            if (searchFor != id) {
              return;
            }
            var found = data.filter(function (r) {
              return r.key.substring(0, theId.length) == theId;
            });
            if (found.length == 1) {
              $('#exploreid').val(found[0].id);
              $('#exploreid').change();
            } else if (found.length > 0) {
              $('#exploreresult').css('display', 'block');
              $('#exploreresult').html('<ul>' + found.map(function(e) { return '<li><a href="#key=' + e.id + '" class="link">' + e.id + '</a></li>'; }).join('\n') + '</ul>');
            } else {
              if (left.length > 0) {
                listids(searchFor, left);
              }
            }
          })
          .fail(function() {
            $('#explorelist').css('display', 'block');
          });
      }
      function search(types) {
        if (searchFor != id) {
          return;
        }
        var type = types[0];
        var left = types.splice(1);
        var theId = searchFor;
        if (type == '') {
          type = typeFromId(theId);
        } else {
          theId = type + '::' + theId;
        }
        var jqXHR = $.ajax(base + theId, settings)
          .done(expandResult.bind(expandResult, searchFor, type, null, null, null, theId, null))
        if (left.length > 0) {
          jqXHR.fail(search.bind(search, left));
        } else {
          jqXHR.fail(listids.bind(listids, searchFor, ['', 'HangerId', 'HangerVersion', 'AspectVersion']));
        }
      }
      search(['', 'HangerId', 'HangerVersion', 'AspectVersion']);
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
        end = hash.length - ind - 4
      }
      return hash.substring(ind + 4, end);
    }
    $('#exploreid').val(hashKey()).change();
  }
  initExplore();
}