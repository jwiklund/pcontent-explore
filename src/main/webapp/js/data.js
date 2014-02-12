function data(window, $) {
  var base = 'da/', id = '', variant = '', aspect = '', settings = {
    cache: false,
    dataType: 'json'
  };
  $('#exploreresult').on('dblclick', 'pre', function(e) {
    var pre = $('#exploreresult pre');
    if (!pre.attr('contenteditable')) {
      var data = JSON.parse(pre.text());
      delete data['id'];
      delete data['version'];
      delete data['meta'];
      $('#exploreresult').html('<pre contenteditable="true"><code>' + JSON.stringify(data, null, "  ") + '</code></pre>');
      $('#exploreresult pre code').each(function(i, e) { hljs.highlightBlock(e); });
      $('#explorefound').css('display', 'none');
      $('#editsave').css('display', 'block');
    }
  });
  function constructurl(id, variant, aspect) {
    var url = base, quest = '?';
    if (id) {
      url = url + '?id=' + id;
      quest = '&';
    }
    if (variant) {
      url = url + quest + 'variant=' + variant;
      quest = '&';
    }
    if (aspect) {
      url = url + quest + 'aspectName=' + aspect;
    }
    return url;
  }
  $('#editsave').on('click', function(e) {
    var data = $('#exploreresult pre').text(),
      url = constructurl(id, variant, aspect);
    $.ajax(url, $.extend({}, { data: data, contentType: 'application/json', method: 'PUT' }))
      .done(function(result) {
        if (result.id) {
          id = result.id;
          $('#exploreid').val(id);
        }
        finalResult(id, variant, aspect, result);
      });
  });
  function finalResult(validForId, validForVariant, validForAspect, data) {
    if (validForId != id || validForVariant != variant || validForAspect != aspect) {
      return;
    }
    if (data.statusCode) {
      $('#exploreerror').html('<pre><code>' + JSON.stringify(data, null, "  ") + '</code></pre>');
      $('#exploreerror pre code').each(function(i, e) { hljs.highlightBlock(e); });
      $('#exploreerror').css('display', 'block');
      return;
    }
    $('#exploreerror').css('display', 'none');
    $('#exploreresult').html('<pre><code>' + JSON.stringify(data, null, "  ") + '</code></pre>');
    $('#exploreresult pre code').each(function(i, e) { hljs.highlightBlock(e); });
    $('#explorefound').css('display', 'block');
    $('#editsave').css('display', 'none');
    var url = document.location.href;
    if (url.indexOf('#') != -1) {
      url = url.substring(0, url.indexOf('#'));
    }
    url = url + '#id=' + validForId;
    if (validForVariant) {
      url = url + '&variant=' + validForVariant;
    }
    if (validForAspect) {
      url = url + '&aspect=' + validForAspect;
    }
    document.location = url;
  }
  function updateSearch(validForId, validForVariant, validForAspect) {
    if (validForId != id || validForVariant != variant || validForAspect != aspect) {
      return;
    }
    $('#explorefound').css('display', 'none');
    if (validForId == '') {
      return;
    }
    var url = constructurl(validForId, validForVariant, validForAspect);
    $.ajax(url, settings)
      .done(finalResult.bind(finalResult, validForId, validForVariant, validForAspect));
  }
  function changeDetect() {
    var nid = idelement.val(), nvariant = variantelement.val(), naspect = aspectelement.val();
    var changed = false;
    if (nid != id) {
      id = nid;
      changed = true;
    }
    if (nvariant != variant) {
      variant = nvariant;
      changed = true;
    }
    if (naspect != aspect) {
      aspect = naspect;
      changed = true;
    }
    if (changed) {
      updateSearch(id, variant, aspect);
    }
  }
  var idelement = $('#exploreid');
  idelement.keyup(changeDetect);
  idelement.change(changeDetect);
  var variantelement = $('#explorevariant');
  variantelement.keyup(changeDetect);
  variantelement.change(changeDetect);
  var aspectelement = $('#exploreaspect');
  aspectelement.keyup(changeDetect);
  aspectelement.change(changeDetect);
  // check for #id= argument
  function hashKey() {
    var hash = document.location.hash, result = {
      id: '',
      variant: '',
      aspect: ''
    };
    var ind = hash.indexOf('id=');
    if (ind != -1) {
      var end = hash.indexOf('&', ind + 3);
      if (end == -1) {
        end = hash.length;
      }
      result.id = hash.substring(ind + 3, end);
    }
    ind = hash.indexOf('variant=');
    if (ind != -1) {
      var end = hash.indexOf('&', ind + 8);
      if (end == -1) {
        end = hash.length;
      }
      result.variant = hash.substring(ind + 8, end);
    }
    ind = hash.indexOf('aspect=');
    if (ind != -1) {
      var end = hash.indexOf('&', ind + 7);
      if (end == -1) {
        end = hash.length;
      }
      result.aspect = hash.substring(ind + 7, end);
    }
    return result;
  }
  var hash = hashKey();
  variantelement.val(hash.variant);
  aspectelement.val(hash.aspect);
  idelement.val(hash.id);
  idelement.change();
}