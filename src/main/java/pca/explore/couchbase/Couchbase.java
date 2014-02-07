package pca.explore.couchbase;

import java.io.IOException;
import java.io.InputStream;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;

import com.couchbase.client.CouchbaseClientIF;
import com.couchbase.client.protocol.views.InvalidViewException;
import com.couchbase.client.protocol.views.Query;
import com.couchbase.client.protocol.views.View;
import com.couchbase.client.protocol.views.ViewResponse;
import com.couchbase.client.protocol.views.ViewRow;
import com.google.common.io.ByteStreams;
import com.sun.jersey.api.NotFoundException;

@Path("/")
public class Couchbase
{
    @GET
    @Path("{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public String get(@Context CouchbaseClientIF cb, @PathParam("id") String id) {
        id = id.replaceAll("_slash_", "/");
        String value = (String) cb.get(id);
        if (value != null) {
            return value;
        }
        throw new NotFoundException();
    }

    @GET
    @Path("search/{view}")
    @Produces(MediaType.APPLICATION_JSON)
    public String search(@Context CouchbaseClientIF cb, @PathParam("view") String viewName, @QueryParam("key") String id) {
        View view;
        try {
            view = cb.getView(viewName, viewName);
        } catch (InvalidViewException e) {
            throw new WebApplicationException(e, 404);
        }
        ViewResponse query = cb.query(view, new Query().setLimit(1000).setRangeStart('"' + id + '"'));
        StringBuilder sb = new StringBuilder();
        for (ViewRow resp : query) {
            if (sb.length() == 0) {
                sb.append("[");
            } else {
                sb.append(",");
            }
            sb.append('"').append(resp.getId()).append('"');
        }
        sb.append("]");
        return sb.toString();
    }

    @PUT
    @Path("{id}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public String put(@Context CouchbaseClientIF cb, @PathParam("id") String id, InputStream data) {
        id = id.replaceAll("_slash_", "/");
        try {
            Future<Boolean> set = cb.set(id, 0, ByteStreams.readBytes(data, new StringProcessor()));
            if (set.get()) {
                return "{'status':'ok'}".replace('\'', '"');
            }
            return "{'status':'failure'}".replace('\'', '"');
        } catch (IOException e) {
            throw new WebApplicationException(e, 500);
        } catch (InterruptedException e) {
            throw new WebApplicationException(e, 500);
        } catch (ExecutionException e) {
            throw new WebApplicationException(e, 500);
        }
    }
}
