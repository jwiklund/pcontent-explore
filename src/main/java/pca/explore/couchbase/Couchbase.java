package pca.explore.couchbase;

import java.io.InputStream;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;

import com.couchbase.client.CouchbaseClientIF;

@Path("couchbase")
public class Couchbase
{
    @GET
    @Path("{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public String get(@Context CouchbaseClientIF cb, @PathParam("id") String id) {
        return null;
    }

    @PUT
    @Path("{id}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public String put(@Context CouchbaseClientIF cb, @PathParam("id") String id, InputStream data) {
        return null;
    }
}
