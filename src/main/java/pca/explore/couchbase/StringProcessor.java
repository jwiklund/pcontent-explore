package pca.explore.couchbase;

import java.io.IOException;

import com.google.common.base.Charsets;
import com.google.common.io.ByteProcessor;

public class StringProcessor implements ByteProcessor<String>
{
    StringBuilder sb = new StringBuilder();

    @Override
    public boolean processBytes(byte[] buf, int off, int len) throws IOException
    {
        sb.append(new String(buf, off, len, Charsets.UTF_8));
        return true;
    }

    @Override
    public String getResult() {
        return sb.toString();
    }
}
