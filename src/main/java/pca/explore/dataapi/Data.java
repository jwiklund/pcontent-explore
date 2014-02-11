package pca.explore.dataapi;

import java.io.InputStream;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;

import com.google.gson.GsonBuilder;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.sun.jersey.api.client.ClientResponse;
import com.sun.jersey.api.client.WebResource;

@Path("/")
public class Data {

    @GET
    @Path("{id}")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public String get(@Context WebResource dataapi, @Context SecurityToken token, @PathParam("id") String id, @QueryParam("variant") String variant)
    {
        WebResource request;
        if (id.matches("\\d+\\.\\d+(?:\\.\\d+)?")) {
            request = dataapi.path("content/contentid/" + id);
        } else if (id.matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")) {
            request = dataapi.path("content/contentid/couch." + id);
        } else {
            request = dataapi.path("content/externalid/" + id);
        }
        request = request.queryParam("format", "json+pretty");
        if (variant != null) {
            request = request.queryParam("variant", variant);
        }
        return request
                .header("X-Auth-Token", token.token)
                .get(ClientResponse.class)
                .getEntity(String.class);
    }

    @PUT
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public String put(@Context WebResource dataapi, @Context SecurityToken token, @QueryParam("id") String id, @QueryParam("variant") String variant, InputStream input)
    {
        if (id == null || id.trim().isEmpty()) {
            WebResource request = dataapi.path("content").queryParam("format", "json");
            if (variant != null && !variant.isEmpty()) {
                request = request.queryParam("variant", variant);
            }
            return respond(dataapi, token, variant, request
                           .header("X-Auth-Token", token.token)
                           .header("Content-Type", "application/json")
                           .post(ClientResponse.class, input));
        } else {
            WebResource request;
            if (id.matches("\\d+\\.\\d+(?:\\.\\d+)?")) {
                request = dataapi.path("content/contentid/" + id);
            } else if (id.matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")) {
                request = dataapi.path("content/contentid/couch." + id);
            } else {
                request = dataapi.path("content/externalid/" + id);
            }
            ClientResponse etag = request
                    .queryParam("format", "json")
                    .header("X-Auth-Token", token.token)
                    .get(ClientResponse.class);
            if (etag.getStatus() != 301 && etag.getStatus() != 200) {
                return etag.getEntity(String.class);
            }
            JsonObject etagdata = parse(etag.getEntity(String.class));
            String actualid = etagdata.getAsJsonPrimitive("id").getAsString();
            WebResource update = dataapi.path("content/contentid/" + actualid).queryParam("format", "json");
            if (variant != null && !variant.isEmpty()) {
                update = update.queryParam("variant", variant);
            }
            return respond(dataapi, token, variant, update
                           .header("X-Auth-Token", token.token)
                           .header("If-Match", etag.getHeaders().getFirst("ETag"))
                           .header("Content-Type", "application/json")
                           .put(ClientResponse.class, input));
        }
    }

    private JsonObject parse(String content) {
        return new GsonBuilder().create().fromJson(content, JsonElement.class).getAsJsonObject();
    }

    private String respond(WebResource dataapi, SecurityToken token, String variant, ClientResponse response) {
        if (response.getStatus() != 200 && response.getStatus() != 201) {
            return response.getEntity(String.class);
        }
        String id = parse(response.getEntity(String.class)).getAsJsonPrimitive("id").getAsString();
        return get(dataapi, token, id, variant);
    }
}
