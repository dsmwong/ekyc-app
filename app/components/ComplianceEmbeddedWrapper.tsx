"use client";

import * as React from "react";
import { Spinner } from "@twilio-paste/core/spinner";
import { Alert } from "@twilio-paste/core/alert";
// import { TwilioComplianceEmbed } from "twilio-compliance-embed";
import { TwilioComplianceEmbed } from "@twilio/twilio-compliance-embed";

export interface ComplianceEmbeddedWrapperProps {
  inquiryEndPointURL: string;
  embeddableProduct: string;
  tollFreeNumber?: string;
  rcPhoneNumberType?: string;
  rcEndUserType?: string;
  rcCountryCode?: string;
  manualRegistrationId?: string;
  manualInquiryId?: string;
  manualInquirySessionToken?: string;
  senderIdValue?: string;
  senderIdFriendlyName?: string;
  senderIdBusinessIdentity?: string;
  senderIdIsSubassigned?: string;
  senderIdHqCountry?: string;
  senderIdUseCaseCategory?: string;
  // Optional sender ID fields
  senderIdBusinessName?: string;
  senderIdBusinessType?: string;
  senderIdBusinessRegNumber?: string;
  senderIdBusinessWebsite?: string;
  senderIdBusinessRegCountry?: string;
  senderIdRegAuthority?: string;
  senderIdTelephoneNumber?: string;
  senderIdTradeName?: string;
  senderIdUseCaseDescription?: string;
  senderIdSampleMessage?: string;
  senderIdAvgMessageVolume?: string;
  senderIdAuthRepFirstName?: string;
  senderIdAuthRepLastName?: string;
  senderIdAuthRepEmail?: string;
  senderIdAuthRepPhone?: string;
  senderIdOfficerFirstName?: string;
  senderIdOfficerLastName?: string;
  senderIdOfficerEmail?: string;
  senderIdStreet?: string;
  senderIdStreetSecondary?: string;
  senderIdCity?: string;
  senderIdRegion?: string;
  senderIdPostalCode?: string;
  senderIdIsoCountry?: string;
  senderIdProofOfSenderId?: string;
  onSetInquiryId: (id: string) => void;
}

const LOCALSTORAGE_CUSTOMER_ID = "CustomerId";
const LOCALSTORAGE_REGISTRATION_ID = "RegistrationId";

const ComplianceEmbeddedWrapper = (props: ComplianceEmbeddedWrapperProps ) => {
  // const [data, setData] = React.useState<IComplianceInquiryData>();
  const [isLoading, setLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string>("");
  const [inquiryId, setInquiryId] = React.useState<string>("");
  const [inquirySessionToken, setInquirySessionToken] =
    React.useState<string>("");

  const CustomerId = window.localStorage.getItem(LOCALSTORAGE_CUSTOMER_ID);

  React.useEffect(() => {

    if (props.manualInquiryId && props.manualInquirySessionToken) {
      setInquiryId(props.manualInquiryId);
      setInquirySessionToken(props.manualInquirySessionToken);
      props.onSetInquiryId(props.manualInquiryId);
      setLoading(false);
      return;
    }

    console.log("Embeddable Product: ", props.embeddableProduct);

    // need to make this configurable and passed into the component.
    if( props.embeddableProduct == "customerProfile") {
  
      let appendCustomerId = "";
      if (CustomerId && CustomerId !== "undefined") {
        appendCustomerId = `?CustomerProfileId=${CustomerId}`;
        console.log(appendCustomerId);
      }
      
      // Call the backend to get the inquiry_id and inquiry_session_token
      fetch(`${props.inquiryEndPointURL}initCustomerProfile${appendCustomerId}`, {
        method: "get",
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("Customer Data");
          console.log(data);
          window.localStorage.setItem(LOCALSTORAGE_CUSTOMER_ID, data.customer_id);

          if (
            (data && data.hasOwnProperty("inquery_id")) ||
            data.hasOwnProperty("inquiry_session_token")
          ) {
            setInquiryId(data.inquiry_id);          
            setInquirySessionToken(data.inquiry_session_token);
            props.onSetInquiryId(data.inquiry_id);
          } else {
            setErrorMessage("Backend not so nice, missing required data");
          }
        })
        .catch((error) => {
          console.error("Error fetching customer data", error);
          setErrorMessage(`Error fetching customer data - ${error.message}`);
        })
        .finally(() => setLoading(false));
      } else if ( props.embeddableProduct == "regulatoryBundle") {


        const countryCode = props.rcCountryCode ? props.rcCountryCode : "GB";
        const STORAGE_KEY = `${LOCALSTORAGE_REGISTRATION_ID}.${countryCode}.${props.rcPhoneNumberType}.${props.rcEndUserType}`;

        const initRegulatoryBundle = (isRetry: boolean = false) => {
          let appendRegistrationId = `?ComplianceRegulationCountry=${countryCode}`;

          // Use manual registration ID if provided, otherwise use localStorage
          let RegistrationId = props.manualRegistrationId;
          if (!RegistrationId) {
            RegistrationId = window.localStorage.getItem(STORAGE_KEY) || undefined;
          }

          // Only include RegistrationId if it exists and this is not a retry
          if (!isRetry && RegistrationId && RegistrationId !== "undefined") {
            appendRegistrationId += `&RegistrationId=${RegistrationId}`;
            console.log("Using RegistrationId:", RegistrationId, props.manualRegistrationId ? "(manual)" : "(localStorage)");
          } else if (isRetry) {
            console.log("Retrying without RegistrationId (fresh bundle)");
          }

          if( props.rcPhoneNumberType) { appendRegistrationId += `&ComplianceRegulationSubType=${props.rcPhoneNumberType}`; }
          if( props.rcEndUserType) { appendRegistrationId += `&ComplianceRegulationEndUserType=${props.rcEndUserType}`; }
          if( props.rcEndUserType && props.rcPhoneNumberType ) { appendRegistrationId += `&friendly_name=${countryCode}%20Bundle%20-%20${props.rcPhoneNumberType}%20${props.rcEndUserType}`; }

          console.log("Fetching regulatory bundle with params:", appendRegistrationId);

          fetch(`${props.inquiryEndPointURL}initRegulatoryBundle${appendRegistrationId}`, {
            method: "get",
          })
            .then((res) => res.json())
            .then((data) => {
              console.log("Registration Data");
              console.log(data);

              // Check if response contains an error
              if (data.error) {
                console.error("Error in regulatory bundle response:", data.error);

                // If this is not already a retry, clear localStorage and retry with fresh bundle
                if (!isRetry) {
                  console.log("Clearing localStorage and retrying with fresh bundle");
                  window.localStorage.removeItem(STORAGE_KEY);
                  setLoading(true);
                  // Retry the request without the RegistrationId
                  initRegulatoryBundle(true);
                  return;
                } else {
                  // If retry also failed, show error
                  setErrorMessage(`Error from backend: ${data.error}`);
                  setLoading(false);
                  return;
                }
              }

              if( data.data?.compliance_registration_id ) {
                window.localStorage.setItem(STORAGE_KEY, data.data?.compliance_registration_id);
                console.log(`Registration ID: ${data.data?.compliance_registration_id}`)
              }

              if (
                (data && data.data?.hasOwnProperty("inquiry_id")) ||
                data.data?.hasOwnProperty("inquiry_session_token")
              ) {
                setInquiryId(data.data?.inquiry_id);
                setInquirySessionToken(data.data?.inquiry_session_token);
                props.onSetInquiryId(data.data?.inquiry_id);
              } else {
                setErrorMessage("Backend not so nice, missing required data, no inquiry_id or inquiry_session_token");
              }
              setLoading(false);
            })
            .catch((error) => {
              console.error("Error fetching regulatory bundle data", error);
              setErrorMessage(`Error fetching regulatory bundle data - ${error.message}`);
              setLoading(false);
            });
        };

        // Start the initial fetch
        initRegulatoryBundle(false);
        } else if( props.embeddableProduct == "tollFreeVerification") {
        console.log("Toll Free Number: ", props.tollFreeNumber);
        // Call the backend to get the inquiry_id and inquiry_session_token
        fetch(`${props.inquiryEndPointURL}initTollFreeVerification?TollfreePhoneNumber=${encodeURIComponent(props.tollFreeNumber || '')}`, {
          method: "get",
        })
          .then((res) => res.json())
          .then((data) => {
            console.log("Toll Free Verification Data");
            console.log(data);
            if (
              (data && data.hasOwnProperty("inquery_id")) ||
              data.hasOwnProperty("inquiry_session_token")
            ) {
              setInquiryId(data.inquiry_id);
              setInquirySessionToken(data.inquiry_session_token);
              console.log(`Registration ID: ${data.registration_id}`)
              props.onSetInquiryId(data.inquiry_id);
            } else {
              setErrorMessage("Backend not so nice, missing required data");
            }
          })
          .catch((error) => {
            console.error("Error fetching toll free verification data", error);
            setErrorMessage(`Error fetching toll free verification data - ${error.message}`);
          })
          .finally(() => setLoading(false));
      } else if (props.embeddableProduct == "senderIdRegistration") {
        console.log("Sender ID Registration: ", props.senderIdValue);

        const SENDER_ID_STORAGE_KEY = `${LOCALSTORAGE_REGISTRATION_ID}.senderId.${props.senderIdValue}`;

        const initSenderIdRegistration = (isRetry: boolean = false) => {
          // Use manual registration ID if provided, otherwise use localStorage
          let RegistrationId = props.manualRegistrationId;
          if (!RegistrationId) {
            RegistrationId = window.localStorage.getItem(SENDER_ID_STORAGE_KEY) || undefined;
          }

          // Only include RegistrationId if it exists and this is not a retry
          const useExisting = !isRetry && RegistrationId && RegistrationId !== "undefined";

          const params: Record<string, string> = {};

          if (useExisting) {
            params.RegistrationId = RegistrationId!;
            console.log("Using RegistrationId:", RegistrationId, props.manualRegistrationId ? "(manual)" : "(localStorage)");
          } else {
            if (isRetry) {
              console.log("Retrying without RegistrationId (fresh registration)");
            }
            params.sender_id = props.senderIdValue || '';
            params.friendly_name = props.senderIdFriendlyName || '';
            params.business_identity = props.senderIdBusinessIdentity || '';
            params.is_subassigned = props.senderIdIsSubassigned || '';
            params.headquarters_country = props.senderIdHqCountry || '';
            params.use_case_category = props.senderIdUseCaseCategory || '';
            // Optional fields - only include when non-empty
            if (props.senderIdBusinessName) params.business_name = props.senderIdBusinessName;
            if (props.senderIdBusinessType) params.business_type = props.senderIdBusinessType;
            if (props.senderIdBusinessRegNumber) params.business_registration_number = props.senderIdBusinessRegNumber;
            if (props.senderIdBusinessWebsite) params.business_website = props.senderIdBusinessWebsite;
            if (props.senderIdBusinessRegCountry) params.business_registration_country = props.senderIdBusinessRegCountry;
            if (props.senderIdRegAuthority) params.registration_authority = props.senderIdRegAuthority;
            if (props.senderIdTelephoneNumber) params.telephone_number = props.senderIdTelephoneNumber;
            if (props.senderIdTradeName) params.trade_name = props.senderIdTradeName;
            if (props.senderIdUseCaseDescription) params.use_case_description = props.senderIdUseCaseDescription;
            if (props.senderIdSampleMessage) params.sample_message = props.senderIdSampleMessage;
            if (props.senderIdAvgMessageVolume) params.average_message_volume_per_month = props.senderIdAvgMessageVolume;
            if (props.senderIdAuthRepFirstName) params.auth_rep_first_name = props.senderIdAuthRepFirstName;
            if (props.senderIdAuthRepLastName) params.auth_rep_last_name = props.senderIdAuthRepLastName;
            if (props.senderIdAuthRepEmail) params.auth_rep_email = props.senderIdAuthRepEmail;
            if (props.senderIdAuthRepPhone) params.auth_rep_phone_number = props.senderIdAuthRepPhone;
            if (props.senderIdOfficerFirstName) params.officer_first_name = props.senderIdOfficerFirstName;
            if (props.senderIdOfficerLastName) params.officer_last_name = props.senderIdOfficerLastName;
            if (props.senderIdOfficerEmail) params.officer_email = props.senderIdOfficerEmail;
            if (props.senderIdStreet) params.street = props.senderIdStreet;
            if (props.senderIdStreetSecondary) params.street_secondary = props.senderIdStreetSecondary;
            if (props.senderIdCity) params.city = props.senderIdCity;
            if (props.senderIdRegion) params.region = props.senderIdRegion;
            if (props.senderIdPostalCode) params.postal_code = props.senderIdPostalCode;
            if (props.senderIdIsoCountry) params.iso_country = props.senderIdIsoCountry;
            if (props.senderIdProofOfSenderId) params.proof_of_sender_id = props.senderIdProofOfSenderId;
          }

          const queryString = new URLSearchParams(params).toString();
          console.log("Fetching sender ID registration with params:", queryString);

          fetch(`${props.inquiryEndPointURL}initSenderIdRegistration?${queryString}`, {
            method: "get",
          })
            .then((res) => res.json())
            .then((data) => {
              console.log("Sender ID Registration Data");
              console.log(data);

              // Check if response contains an error
              if (data.error) {
                console.error("Error in sender ID registration response:", data.error);
                if (!isRetry) {
                  console.log("Clearing localStorage and retrying with fresh registration");
                  window.localStorage.removeItem(SENDER_ID_STORAGE_KEY);
                  setLoading(true);
                  initSenderIdRegistration(true);
                  return;
                } else {
                  setErrorMessage(`Error from backend: ${data.error}`);
                  setLoading(false);
                  return;
                }
              }

              // Store registration ID for future sessions
              if (data.id) {
                window.localStorage.setItem(SENDER_ID_STORAGE_KEY, data.id);
                console.log(`Registration ID: ${data.id}`);
              }

              // Handle response - new registration vs embedded session refresh
              // New registration: embeddedSession.sessionId / embeddedSession.sessionToken
              // Embedded session refresh: sessionId / sessionToken
              const sessionId = data.embeddedSession?.sessionId || data.sessionId;
              const sessionToken = data.embeddedSession?.sessionToken || data.sessionToken;

              if (sessionId && sessionToken) {
                setInquiryId(sessionId);
                setInquirySessionToken(sessionToken);
                props.onSetInquiryId(sessionId);
              } else {
                setErrorMessage("Backend response missing sessionId or sessionToken");
              }
              setLoading(false);
            })
            .catch((error) => {
              console.error("Error fetching sender ID registration data", error);
              setErrorMessage(`Error fetching sender ID registration data - ${error.message}`);
              setLoading(false);
            });
        };

        initSenderIdRegistration(false);
      }


  }, [CustomerId, props.manualInquiryId, props.manualInquirySessionToken, props.manualRegistrationId]);

  if (isLoading) return <Spinner decorative={false} title="Loading" />;
  if (errorMessage) return <Alert variant="warning">{errorMessage}</Alert>;
  if (!inquiryId) return <Alert variant="warning">Missing Inquiry ID </Alert>;
  if (!inquirySessionToken)
    return <Alert variant="warning">Missing Session Token</Alert>;

  return (
      <TwilioComplianceEmbed
        inquiryId={inquiryId}
        inquirySessionToken={inquirySessionToken}
        onReady={() => {
          console.log("Ready!");
        }}
        onComplete={() => {
          console.log("Registration complete");
        }}
      />
  );
};

export default ComplianceEmbeddedWrapper;
