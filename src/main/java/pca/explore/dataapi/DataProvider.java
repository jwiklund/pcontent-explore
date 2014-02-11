package pca.explore.dataapi;

import java.io.IOException;
import java.net.ConnectException;
import java.net.Socket;
import java.net.UnknownHostException;

import javax.ws.rs.core.Context;
import javax.ws.rs.ext.Provider;

import com.sun.jersey.api.client.Client;
import com.sun.jersey.api.client.WebResource;
import com.sun.jersey.core.spi.component.ComponentContext;
import com.sun.jersey.spi.inject.Injectable;
import com.sun.jersey.spi.inject.PerRequestTypeInjectableProvider;

@Provider
public class DataProvider extends PerRequestTypeInjectableProvider<Context, WebResource>
{

    public DataProvider() {
        super(WebResource.class);
    }

    @Override
    public Injectable<WebResource> getInjectable(ComponentContext ic, Context a) {
        return new Injectable<WebResource>() {
            int port = -1;
            @Override
            public WebResource getValue() {
                if (port == -1) {
                    if (checkPort(8081)) {
                        port = 8081;
                    } else if (checkPort(9090)) {
                        port = 9090;
                    }
                }
                if (port == -1) {
                    throw new RuntimeException("No data api available");
                }
                return Client.create().resource("http://localhost:" + port + "/content-hub/ws").queryParam("format", "json+pretty");
            }
        };
    }

    private static boolean checkPort(int port) {
        try {
            new Socket("localhost", port).close();
            return true;
        } catch (UnknownHostException e) {
            throw new RuntimeException(e);
        } catch (ConnectException e) {
            return false;
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
