function explore(window, $, hljs) {
    'use strict';
    var base = 'cb/', id = '', dcontent = '', dvariant = '', daspect = '', idelement, hash,
        settings = { cache: false, dataType: 'json' };
    $('#exploreresult').on('click', '.link', function (e) {
        if (e.ctrlKey) {
            return;
        }
        $('#exploreid').val($(e.target).text());
        $('#exploreid').change();
        e.preventDefault();
    });
    function constructurl(url, quest, id, dcontent, dvariant, daspect) {
        if (id) {
            url = url + quest + 'key=' + id;
            quest = '&';
        }
        if (dvariant) {
            url = url + quest + 'variant=' + dvariant;
            quest = '&';
        }
        if (daspect) {
            url = url + quest + 'aspect=' + daspect;
        }
        if (dcontent) {
            url = url + quest + 'id=' + dcontent;
        }
        return url;
    }
    $('#dlink').on('click', function (e) {
        window.document.location = constructurl('data.html', '#', id, dcontent, dvariant, daspect);
        e.preventDefault();
    });
    $('.createview').on('click', function (e) {
        $.ajax(base + 'view', $.extend({}, {method: 'POST', data: '{"operation":"create"}', contentType: 'application/json' }, settings))
            .done(function () {
                $('#explorelist').css('display', 'none');
            })
            .fail(function () {
                window.console.log('Create ids view failed');
            });
        e.preventDefault();
    });
    function finalResult(validForId, data) {
        if (validForId !== id) {
            return;
        }
        $('#explorefound').css('display', 'block');
        $('#exploreresult').html('<pre><code>' + JSON.stringify(data, null, "  ") + '</code></pre>');
        $('#exploreresult pre code').each(function (i, e) { hljs.highlightBlock(e); });
        var url = window.document.location.href;
        if (url.indexOf('#') !== -1) {
            url = url.substring(0, url.indexOf('#'));
        }
        window.document.location = constructurl(url, '#', validForId, dcontent, dvariant, daspect);
    }
    function typeFromId(id) {
        if (id.indexOf('::') === -1) {
            return 'unknown';
        }
        return id.substring(0, id.indexOf('::'));
    }
    function expandError(validForId, topData, currentData, resultKey, count, jqXHR, textStatus) {
        if (validForId !== id) {
            return;
        }
        currentData[resultKey] = 'not found';
        if (count) {
            count.count = count.count - 1;
            if (count.count === 0) {
                finalResult(validForId, topData);
            }
        } else {
            finalResult(validForId, topData);
        }
    }
    function expandResult(validForId, dataType, topData, currentData, resultKey, count, resultData) {
        var newData = resultData.data, get, aspects, aspect, i;
        if (validForId !== id) {
            return;
        }
        if (dataType === null) {
            dataType = typeFromId(resultData.id);
        }
        newData = $.extend({}, {'_InternalId': resultData.id}, newData);
        if (resultKey) {
            currentData[resultKey] = newData;
        } else {
            topData = newData;
        }
        if (dataType === 'HangerId') {
            get = 'HangerVersion::' + newData.key;
            $.ajax(base + get, settings)
                .done(expandResult.bind(expandResult, validForId, 'HangerVersion', topData, newData, 'key :  ' + newData.key, count))
                .fail(expandError.bind(expandError, validForId, topData, newData, 'key-' + newData.key, count));
        } else if (dataType === 'HangerVersion') {
            get = 'Hanger::' + newData.contentId.key + "::" + newData.version;
            $.ajax(base + get, settings)
                .done(expandResult.bind(expandResult, validForId, 'Hanger', topData, newData, 'version :  ' + newData.version, count))
                .fail(expandError.bind(expandError, validForId, topData, newData, 'version-' + newData.version, count));
        } else if (dataType === 'Hanger') {
            aspects = { count: 0 };
            for (i in newData.aspectLocations) {
                if (newData.aspectLocations.hasOwnProperty(i)) {
                    aspects.count = aspects.count + 1;
                }
            }
            for (i in newData.aspectLocations) {
                if (newData.aspectLocations.hasOwnProperty(i)) {
                    aspect = newData.aspectLocations[i];
                    get = 'AspectVersion::' + aspect.key;
                    $.ajax(base + get, settings)
                        .done(expandResult.bind(expandResult, validForId, 'AspectVersion', topData, aspect, 'key :  ' + aspect.key, count))
                        .fail(expandError.bind(expandError, validForId, topData, aspect, 'key :  ' + aspect.key, count));
                }
            }
        } else if (dataType === 'AspectVersion') {
            get = 'Aspect::' + newData.contentId.key + '::' + newData.version;
            $.ajax(base + get, settings)
                .done(expandResult.bind(expandResult, validForId, 'Aspect', topData, newData, 'version : ' + newData.version, count))
                .fail(expandError.bind(expandError, validForId, topData, newData, 'version-' + newData.version, count));
        } else {
            if (count) {
                count.count = count.count - 1;
                if (count.count === 0) {
                    finalResult(validForId, topData);
                }
            } else {
                finalResult(validForId, topData);
            }
        }
    }
    function search(searchFor) {
        if (searchFor !== id) {
            return;
        }
        $('#explorefound').css('display', 'none');
        var searchUrl = base + 'search/ids?key=' + searchFor + '&key=HangerId::' + searchFor + '&key=HangerVersion::' + searchFor + '&key=AspectVersion::' + searchFor;
        $.ajax(searchUrl, settings)
            .done(function (found) {
                if (searchFor !== id) {
                    return;
                }
                if (found.length === 1) {
                    $('#exploreid').val(found[0]);
                    $('#exploreid').change();
                } else if (found.length > 0) {
                    $('#exploreresult').css('display', 'block');
                    $('#exploreresult').html('<ul>' + found.map(function (id) { return '<li><a href="#key=' + id + '" class="link">' + id + '</a></li>'; }).join('\n') + '</ul>');
                }
            })
            .fail(function () {
                $('#explorelist').css('display', 'block');
            });
    }
    function updateSearch(searchFor) {
        if (searchFor !== id) {
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
        if (nid !== id) {
            id = nid;
            updateSearch(id);
        }
    }
    idelement = $('#exploreid');
    idelement.keyup(changeDetect);
    idelement.change(changeDetect);
    $('#exploreid').keydown(function () {
        var now = $('#exploreid');
    });
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
            id: parseHash('key'),
            dvariant: parseHash('variant'),
            daspect: parseHash('aspect'),
            dcontent: parseHash('id')
        };
    }
    hash = hashKey();
    dcontent = hash.dcontent;
    dvariant = hash.dvariant;
    daspect = hash.daspect;
    $('#exploreid').val(hash.id).change();
}
