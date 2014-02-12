package pca.explore.dataapi;

import java.util.concurrent.TimeUnit;

import javax.ws.rs.core.Context;
import javax.ws.rs.ext.Provider;

import com.google.gson.GsonBuilder;
import com.google.gson.JsonElement;
import com.sun.jersey.api.client.WebResource;
import com.sun.jersey.core.spi.component.ComponentContext;
import com.sun.jersey.spi.inject.Injectable;
import com.sun.jersey.spi.inject.PerRequestTypeInjectableProvider;

@Provider
public class SecurityTokenProvider extends PerRequestTypeInjectableProvider<Context, SecurityToken>
{
    public SecurityTokenProvider() {
        super(SecurityToken.class);
    }

    @Override
    public Injectable<SecurityToken> getInjectable(ComponentContext ic, Context a) {
        final Object[] sync = new Object[0];
        return new Injectable<SecurityToken>() {
            private SecurityToken token;
            private long created;
            @Override
            public SecurityToken getValue() {
                if (token == null || Math.abs(TimeUnit.HOURS.convert(System.nanoTime() - created, TimeUnit.NANOSECONDS)) > 0) {
                    synchronized (sync) {
                        if (token == null || Math.abs(TimeUnit.HOURS.convert(System.nanoTime() - created, TimeUnit.NANOSECONDS)) > 0) {
                            token = login();
                            created = System.nanoTime();
                        }
                    }
                }
                return token;
            }
        };
    }

    SecurityToken login() {
        String details = "{\"username\":\"sysadmin\",\"password\":\"sysadmin\"}";
        WebResource dataapi = new DataProvider().getInjectable(null, null).getValue();
        String response = dataapi.path("security/token")
                .queryParam("format", "json")
                .header("Content-Type", "application/json")
                .post(String.class, details);
        JsonElement result = new GsonBuilder().create().fromJson(response, JsonElement.class);
        return new SecurityToken(result.getAsJsonObject().getAsJsonPrimitive("token").getAsString());
    }
}
