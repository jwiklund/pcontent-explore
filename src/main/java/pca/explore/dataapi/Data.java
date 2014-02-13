package pca.explore.dataapi;

import java.io.InputStream;
import java.util.logging.Logger;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;

import com.google.gson.GsonBuilder;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.sun.jersey.api.client.ClientResponse;
import com.sun.jersey.api.client.WebResource;
import com.sun.jersey.api.client.WebResource.Builder;

@Path("/")
public class Data {
    public final String SEP = ":";

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public String get(@Context WebResource dataapi, @Context SecurityToken token,
            @QueryParam("id") String id, @QueryParam("variant") String variant, @QueryParam("aspectName") String aspectName)
    {
        WebResource request = addParams(path(dataapi, id), variant, aspectName);
        ClientResponse resp = request
                .header("X-Auth-Token", token.token)
                .get(ClientResponse.class);
        String msg = resp.getEntity(String.class);
        if ("text/html;charset=utf-8".equals(resp.getHeaders().getFirst("Content-Type"))) {
            Logger.getLogger("DataApi").warning("Request failed " + request.getURI());
            int index = msg.indexOf("<pre>");
            if (index != -1) {
                msg = msg.substring(index + 5);
            }
            index = msg.indexOf("</pre>");
            if (index != -1) {
                msg = msg.substring(0, index);
            }
            Logger.getLogger("DataApi").warning(msg);
            return "{\"statusCode\": \"50000\", \"message\":\"Data API internal error, see log\"}";
        }
        return msg;
    }

    @PUT
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public String put(@Context WebResource dataapi, @Context SecurityToken token, InputStream input,
            @QueryParam("id") String id, @QueryParam("variant") String variant, @QueryParam("aspectName") String aspectName)
    {
        if (id == null || id.trim().isEmpty()) {
            return respond(dataapi, token, variant, aspectName, 
                    addParams(dataapi.path("content"), variant, aspectName)
                        .header("X-Auth-Token", token.token)
                        .header("Content-Type", "application/json")
                        .post(ClientResponse.class, input));
        } else {
            ClientResponse etag = addParams(path(dataapi, id), variant, aspectName)
                    .header("X-Auth-Token", token.token)
                    .get(ClientResponse.class);
            String etagValue;
            String actualid;
            if (aspectName != null && etag.getStatus() == 404) {
                etagValue = null;
                ClientResponse get = addParams(path(dataapi, id), variant, null).header("X-Auth-Token", token.token).get(ClientResponse.class);
                if (get.getStatus() != 200) {
                    return get.getEntity(String.class);
                }
                JsonObject getdata = parse(get.getEntity(String.class));
                actualid = getdata.getAsJsonPrimitive("id").getAsString();
            } else if (etag.getStatus() != 301 && etag.getStatus() != 200) {
                return etag.getEntity(String.class);
            } else {
                etagValue = etag.getHeaders().getFirst("ETag");
                JsonObject etagdata = parse(etag.getEntity(String.class));
                actualid = etagdata.getAsJsonPrimitive("id").getAsString();
            }
            Builder updateRequest = addParams(dataapi.path("content/contentid/" + actualid), variant, aspectName)
                .header("X-Auth-Token", token.token)
                .header("Content-Type", "application/json");
            ClientResponse updateResponse;
            if (etagValue == null) {
                updateResponse = updateRequest.post(ClientResponse.class, input);
            } else {
                updateResponse = updateRequest
                        .header("If-Match", etagValue)
                        .put(ClientResponse.class, input);
            }
            return respond(dataapi, token, variant, aspectName, updateResponse);
        }
    }

    private WebResource path(WebResource dataapi, String id) {
        WebResource request;
        if (id.matches("\\d+\\.\\d+(?:\\.\\d+)?")) {
            request = dataapi.path("content/contentid/" + id);
        } else if (id.matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")) {
            request = dataapi.path("content/contentid/couch" + SEP + id);
        } else if (id.matches(".*[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")) {
            request = dataapi.path("content/contentid/couch" + id);
        } else {
            request = dataapi.path("content/externalid/" + id);
        }
        return request;
    }

    private WebResource addParams(WebResource request, String variant,
            String aspectName) {
        if (variant != null) {
            request = request.queryParam("variant", variant);
        }
        if (aspectName != null) {
            request = request.queryParam("aspectName", aspectName);
        }
        return request;
    }

    private JsonObject parse(String content) {
        return new GsonBuilder().create().fromJson(content, JsonElement.class).getAsJsonObject();
    }

    private String respond(WebResource dataapi, SecurityToken token, String variant, String aspect, ClientResponse response) {
        if (response.getStatus() != 200 && response.getStatus() != 201) {
            return response.getEntity(String.class);
        }
        String id = parse(response.getEntity(String.class)).getAsJsonPrimitive("id").getAsString();
        return get(dataapi, token, id, variant, aspect);
    }
}
