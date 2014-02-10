package pca.explore.couchbase;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;

import com.couchbase.client.CouchbaseClientIF;
import com.couchbase.client.protocol.views.DesignDocument;
import com.couchbase.client.protocol.views.InvalidViewException;
import com.couchbase.client.protocol.views.Query;
import com.couchbase.client.protocol.views.SpatialViewDesign;
import com.couchbase.client.protocol.views.View;
import com.couchbase.client.protocol.views.ViewDesign;
import com.couchbase.client.protocol.views.ViewResponse;
import com.couchbase.client.protocol.views.ViewRow;
import com.sun.jersey.api.NotFoundException;

@Path("/")
public class Couchbase
{
    @GET
    @Path("search/{view}")
    @Produces(MediaType.APPLICATION_JSON)
    public String search(@Context CouchbaseClientIF cb, @PathParam("view") String viewName, @QueryParam("key") List<String> keys) {
        View view;
        try {
            view = cb.getView(viewName, viewName);
        } catch (InvalidViewException e) {
            throw new WebApplicationException(e, 404);
        }
        Set<String> ids = new TreeSet<>();
        for (String key : keys) {
            String findKey = key.toLowerCase();
            ViewResponse query = cb.query(view, new Query().setLimit(100).setRangeStart('"' + findKey + '"'));
            for (ViewRow resp : query) {
                if (!resp.getKey().startsWith(findKey)) {
                    break;
                }
                ids.add(resp.getId());
            }
            if (!ids.isEmpty()) {
                break;
            }
        }
        StringBuilder sb = new StringBuilder();
        sb.append("[");
        for (String id : ids) {
            if (sb.length() != 1) {
                sb.append(",");
            }
            sb.append('"').append(id).append('"');
        }
        sb.append("]");
        return sb.toString();
    }

    @GET
    @Path("{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public String get(@Context CouchbaseClientIF cb, @PathParam("id") String id) {
        id = id.replaceAll("_slash_", "/");
        String value = (String) cb.get(id);
        if (value != null) {
            return "{\"id\":\"" + id + "\", \"data\":" + value + "}"; 
        }
        throw new NotFoundException();
    }

    @POST
    @Path("view")
    @Produces(MediaType.APPLICATION_JSON)
    public String put(@Context CouchbaseClientIF cb) {
        List<ViewDesign> views = new ArrayList<>(1);
        views.add(new ViewDesign("ids", "function (doc, meta) { emit(meta.id.toLowerCase(), null); }"));
        DesignDocument ids = new DesignDocument("ids", views, Collections.<SpatialViewDesign>emptyList());
        if (cb.createDesignDoc(ids)) {
            return "{'status':'ok'}".replace('\'', '"');
        }
        return "{'status':'failure'}".replace('\'', '"');
    }
}
