function data(window, $) {
  var base = 'da/', id = '', variant = '', settings = {
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
    var url = document.location.href;
    if (url.indexOf('#') != -1) {
      url = url.substring(0, url.indexOf('#'));
    }
    url = url + '#id=' + validForId;
    if (variant) {
      url = url + '&variant=' + validForVariant;
    }
    document.location = url;
  }
  function updateSearch(validForId, validForVariant) {
    if (validForId != id || validForVariant != variant) {
      return;
    }
    $('#explorefound').css('display', 'none');
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