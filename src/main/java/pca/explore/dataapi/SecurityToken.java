package pca.explore.dataapi;

public class SecurityToken {
    public final String token;

    public SecurityToken(String token) {
        this.token = token;
    }

    @Override
    public String toString() {
        return "SecurityToken [token=" + token + "]";
    }
}
