package pca.explore.dataapi;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;

import com.sun.jersey.api.client.ClientResponse;
import com.sun.jersey.api.client.WebResource;

@Path("/")
public class Data {

    @GET
    @Path("{id}")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public String get(@Context WebResource dataapi, @PathParam("id") String id, @QueryParam("token") String token, @QueryParam("variant") String variant)
    {
        WebResource response = dataapi.path("content/contentid/" + id).queryParam("format", "json+pretty");
        if (variant != null) {
            response = response.queryParam("variant", variant);
        }
        return response
                .header("X-Security-Token", token)
                .get(ClientResponse.class)
                .getEntity(String.class);
    }
}
