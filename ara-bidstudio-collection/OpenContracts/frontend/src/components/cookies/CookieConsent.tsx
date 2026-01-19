import { List, Modal, Header, Icon, Button } from "semantic-ui-react";
import { useMutation, useReactiveVar } from "@apollo/client";
import { toast } from "react-toastify";

import inverted_cookie_icon from "../../assets/icons/noun-cookie-2123093-FFFFFF.png";
import { showCookieAcceptModal, authToken } from "../../graphql/cache";
import {
  ACCEPT_COOKIE_CONSENT,
  AcceptCookieConsentInputs,
  AcceptCookieConsentOutputs,
} from "../../graphql/mutations";

export const CookieConsentDialog = () => {
  const auth_token = useReactiveVar(authToken);
  const isAuthenticated = Boolean(auth_token);

  const [acceptCookieConsent, { loading }] = useMutation<
    AcceptCookieConsentOutputs,
    AcceptCookieConsentInputs
  >(ACCEPT_COOKIE_CONSENT, {
    onCompleted: (data) => {
      if (data.acceptCookieConsent.ok) {
        toast.success("Cookie consent recorded");
        showCookieAcceptModal(false);
      } else {
        toast.error(
          `Failed to record consent: ${data.acceptCookieConsent.message}`
        );
        // Still close the modal and set localStorage as fallback
        localStorage.setItem("oc_cookieAccepted", "true");
        showCookieAcceptModal(false);
      }
    },
    onError: (error) => {
      toast.error(`Error recording consent: ${error.message}`);
      // Still close the modal and set localStorage as fallback
      localStorage.setItem("oc_cookieAccepted", "true");
      showCookieAcceptModal(false);
    },
  });

  const handleAccept = () => {
    if (isAuthenticated) {
      // For authenticated users, call the mutation
      acceptCookieConsent();
    } else {
      // For anonymous users, use localStorage only
      localStorage.setItem("oc_cookieAccepted", "true");
      showCookieAcceptModal(false);
    }
  };

  return (
    <Modal basic size="small" open>
      <Header icon>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          <div>
            <Icon name="warning" />
          </div>
        </div>
        <div style={{ marginTop: ".5em" }}>DEMO SYSTEM</div>
      </Header>
      <Modal.Content style={{ marginTop: "0", paddingTop: "0" }}>
        <Header inverted textAlign="center">
          <Header.Content as="h4">
            <u>Cookie Policy</u>
          </Header.Content>
        </Header>
        <p>
          This website uses cookies to enhance the user experience and help us
          refine OpenContracts. We do not sell or share user information. Please
          accept the cookie to continue.
        </p>
        <Header inverted textAlign="center">
          <Header.Content as="h4">
            <u>NO REPRESENTATIONS OR WARRANTIES</u>
          </Header.Content>
        </Header>
        <p>
          This is a demo system with <b>NO</b> guarantee of uptime or data
          retention. We may delete accounts and data{" "}
          <u>AT ANY TIME AND FOR ANY REASON</u>. THE SOFTWARE IS PROVIDED "AS
          IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
          NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
          PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
          OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
          LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
          ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
          OTHER DEALINGS IN THE SOFTWARE.
        </p>
        <Header inverted textAlign="center">
          <Header.Content as="h4">
            <u>Data We Collect</u>
          </Header.Content>
        </Header>
        <List>
          <List.Item>
            <List.Icon name="users" />
            <List.Content>User Information (email, name, ip)</List.Content>
          </List.Item>
          <List.Item>
            <List.Icon name="settings" />
            <List.Content>Usage Information</List.Content>
          </List.Item>
          <List.Item>
            <List.Icon name="computer" />
            <List.Content>System Information</List.Content>
          </List.Item>
        </List>
        <Header inverted textAlign="center">
          <Header.Content as="h4">
            <u>Data You Agree to Share</u>
          </Header.Content>
        </Header>
        <p>
          By interacting with this demo system, you agree to share the following
          under a CC0 1.0 Universal license:
        </p>
        <List>
          <List.Item>
            <List.Icon name="users" />
            <List.Content>Labelsets & Labels</List.Content>
          </List.Item>
          <List.Item>
            <List.Icon name="computer" />
            <List.Content>Configured Data Extractors</List.Content>
          </List.Item>
        </List>
      </Modal.Content>
      <Modal.Actions>
        <Button
          color="green"
          inverted
          loading={loading}
          disabled={loading}
          onClick={handleAccept}
        >
          <Icon name="checkmark" /> Accept
        </Button>
      </Modal.Actions>
    </Modal>
  );
};
