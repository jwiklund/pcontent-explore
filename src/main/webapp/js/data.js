function data(window, $, hljs) {
    "use strict";
    var base = 'da/', id = '', variant = '', aspect = '', pcontent = '',
        idelement = $('#exploreid'), variantelement = $('#explorevariant'), aspectelement = $('#exploreaspect'),
        explorefound = $('#explorefound'), exploreerror = $('#exploreerror'), exploreresult = $('#exploreresult'),
        editsave = $('#editsave'), hash, settings = { cache: false, dataType: 'json' };
    function constructurl(url, quest, id, variant, aspect, pcontent) {
        if (id) {
            url = url + quest + 'id=' + id;
            quest = '&';
        }
        if (variant) {
            url = url + quest + 'variant=' + variant;
            quest = '&';
        }
        if (aspect) {
            url = url + quest + 'aspect=' + aspect;
        }
        if (pcontent) {
            url = url + quest + 'key=' + pcontent;
        }
        return url;
    }
    function finalResult(validForId, validForVariant, validForAspect, data) {
        if (validForId !== id || validForVariant !== variant || validForAspect !== aspect) {
            return;
        }
        if (data.statusCode) {
            exploreerror.html('<pre><code>' + JSON.stringify(data, null, "  ") + '</code></pre>');
            exploreerror.find('pre code').each(function (i, e) { hljs.highlightBlock(e); });
            exploreerror.css('display', 'block');
            return;
        }
        exploreerror.css('display', 'none');
        exploreresult.html('<pre><code>' + JSON.stringify(data, null, "  ") + '</code></pre>');
        exploreresult.find('pre code').each(function (i, e) { hljs.highlightBlock(e); });
        explorefound.css('display', 'block');
        editsave.css('display', 'none');
        var url = window.document.location.href;
        if (url.indexOf('#') !== -1) {
            url = url.substring(0, url.indexOf('#'));
        }
        url = url + '#id=' + validForId;
        if (validForVariant) {
            url = url + '&variant=' + validForVariant;
        }
        if (validForAspect) {
            url = url + '&aspect=' + validForAspect;
        }
        window.document.location = url;
    }
    function updateSearch(validForId, validForVariant, validForAspect) {
        if (validForId !== id || validForVariant !== variant || validForAspect !== aspect) {
            return;
        }
        explorefound.css('display', 'none');
        if (validForId === '') {
            return;
        }
        var url = constructurl(base, '?', validForId, validForVariant, validForAspect);
        $.ajax(url, settings)
            .done(finalResult.bind(finalResult, validForId, validForVariant, validForAspect));
    }
    function changeDetect() {
        var nid = idelement.val(), nvariant = variantelement.val(), naspect = aspectelement.val(), changed = false;
        if (nid !== id) {
            id = nid;
            changed = true;
        }
        if (nvariant !== variant) {
            variant = nvariant;
            changed = true;
        }
        if (naspect !== aspect) {
            aspect = naspect;
            changed = true;
        }
        if (changed) {
            updateSearch(id, variant, aspect);
        }
    }
    function hashKey() {
        var hash = window.document.location.hash;
        function parseHash(name) {
            var ind = hash.indexOf(name + '='), end;
            if (ind === -1) {
                return '';
            }
            end = hash.indexOf('&', ind + name.length + 1);
            if (end === -1) {
                end = hash.length;
            }
            return hash.substring(ind + name.length + 1, end);
        }
        return {
            id: parseHash('id'),
            variant: parseHash('variant'),
            aspect: parseHash('aspect'),
            pcontent: parseHash('key')
        };
    }
    exploreresult.on('dblclick', 'pre', function (e) {
        var pre = $('#exploreresult pre'), data;
        if (!pre.attr('contenteditable')) {
            data = JSON.parse(pre.text());
            delete data.id;
            delete data.version;
            delete data.meta;
            $('#exploreresult').html('<pre contenteditable="true"><code>' + JSON.stringify(data, null, "  ") + '</code></pre>');
            $('#exploreresult pre code').each(function (i, e) { hljs.highlightBlock(e); });
            $('#explorefound').css('display', 'none');
            $('#editsave').css('display', 'block');
        }
    });
    $('#plink').on('click', function (e) {
        window.document.location = constructurl('index.html', '#', id, variant, aspect, pcontent);
        e.preventDefault();
    });
    editsave.on('click', function (e) {
        var data = $('#exploreresult pre').text(),
            url = constructurl(base, '?', id, variant, aspect);
        $.ajax(url, $.extend({}, { data: data, contentType: 'application/json', method: 'PUT' }))
            .done(function (result) {
                if (result.id) {
                    id = result.id;
                    $('#exploreid').val(id);
                }
                finalResult(id, variant, aspect, result);
            });
    });
    idelement.keyup(changeDetect);
    idelement.change(changeDetect);
    variantelement.keyup(changeDetect);
    variantelement.change(changeDetect);
    aspectelement.keyup(changeDetect);
    aspectelement.change(changeDetect);
    hash = hashKey();
    pcontent = hash.pcontent;
    variantelement.val(hash.variant);
    aspectelement.val(hash.aspect);
    idelement.val(hash.id);
    idelement.change();
}