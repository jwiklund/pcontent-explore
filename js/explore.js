var explore = function(window, $) {
  var base = '/couchbase/couchBase/cmbucket/';
  function initExplore(details) {
    $('#login').css('display', 'none');
    $('#explore').css('display', 'block');
    $('#exploreresult').on('click', '.link', function(e) {
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
      $.ajax(base + '_design/ids', $.extend({}, {method: 'PUT', data: JSON.stringify(doc), contentType: 'application/json' }, settings))
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
        $.ajax(base + '_design/ids/_view/ids?limit=20&startkey="' + theId + '"', settings)
          .done(function(data) {
            if (searchFor != id) {
              return;
            }
            var found = data.rows.filter(function (r) {
              return r.key.substring(0, theId.length) == theId;
            });
            if (found.length == 1) {
              $('#exploreid').val(found[0].id);
              $('#exploreid').change();
            } else if (found.length > 0) {
              $('#exploreresult').css('display', 'block');
              $('#exploreresult').html('<ul>' + found.map(function(e) { return '<li><a href="#" class="link">' + e.id + '</a></li>'; }).join('\n') + '</ul>');
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
          .done(expandResult.bind(expandResult, searchFor, type, null, null, null, null))
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