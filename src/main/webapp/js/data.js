function data(window, $) {
  var base = 'da/', id = '', variant = '', settings = {
    cache: false,
    dataType: 'json'
  };
  $('#exploreresult').on('click', 'pre', function(e) {
    var pre = $('#exploreresult pre');
    if (!pre.attr('contenteditable')) {
      var text = pre.text();
      var data = { contentData: JSON.parse(text).contentData };
      $('#exploreresult').html('<pre contenteditable="true"><code>' + JSON.stringify(data, null, "  ") + '</code></pre>');
      $('#exploreresult pre code').each(function(i, e) { hljs.highlightBlock(e); });
      $('#explorefound').css('display', 'none');
      $('#editsave').css('display', 'block');
    }
  });

  $('#editsave').on('click', function(e) {
    var data = $('#exploreresult pre').text();
    var url = base;
    if (variant && id) {
      url = url + '?variant=' + variant + '&id=' + id;
    } else if (variant) {
      url = url + '?variant=' + variant;
    } else if (id) {
      url = url + '?id=' + id;
    }
    $.ajax(url, $.extend({}, { data: data, contentType: 'application/json', method: 'PUT' }))
      .done(function(result) {
        id = result.id;
        $('#exploreid').val(id);
        finalResult(id, variant, result);
      });
  });
  function finalResult(validForId, validForVariant, data) {
    if (validForId != id || validForVariant != variant) {
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
    document.location = url;
  }
  function updateSearch(validForId, validForVariant) {
    if (validForId != id || validForVariant != variant) {
      return;
    }
    $('#explorefound').css('display', 'none');
    if (validForId == '') {
      return;
    }
    var findUrl = base + validForId;
    if (validForVariant != '') {
      findUrl = findUrl + '?variant=' + validForVariant;
    }
    $.ajax(findUrl, settings)
      .done(finalResult.bind(finalResult, validForId, validForVariant));
  }
  function changeDetect() {
    var nid = idelement.val(), nvariant = variantelement.val();
    var changed = false;
    if (nid != id) {
      id = nid;
      changed = true;
    }
    if (nvariant != variant) {
      variant = nvariant;
      changed = true;
    }
    if (changed) {
      updateSearch(id, variant);
    }
  }
  var idelement = $('#exploreid');
  idelement.keyup(changeDetect);
  idelement.change(changeDetect);
  var variantelement = $('#explorevariant');
  variantelement.keyup(changeDetect);
  variantelement.change(changeDetect);
  // check for #id= argument
  function hashKey() {
    var hash = document.location.hash, result = {
      id: '',
      variant: ''
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
    return result;
  }
  var hash = hashKey();
  variantelement.val(hash.variant);
  idelement.val(hash.id);
  idelement.change();
}