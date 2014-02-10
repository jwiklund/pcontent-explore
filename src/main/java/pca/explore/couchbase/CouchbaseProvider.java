package pca.explore.couchbase;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;

import javax.ws.rs.ext.Provider;

import com.couchbase.client.CouchbaseClient;
import com.couchbase.client.CouchbaseClientIF;
import com.sun.jersey.core.impl.provider.xml.LazySingletonContextProvider;

@Provider
public class CouchbaseProvider extends LazySingletonContextProvider<CouchbaseClientIF>
{
    public CouchbaseProvider() {
        super(CouchbaseClientIF.class);
    }

    @Override
    protected CouchbaseClientIF getInstance() {
        List<URI> baseList = new ArrayList<URI>(1);
        try {
            baseList.add(new URI("http://localhost:8091/pools"));
            return new CouchbaseClient(baseList, "cmbucket", "cmpasswd");
        } catch (URISyntaxException e) {
            throw new RuntimeException(e);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
