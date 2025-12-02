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
          const RegistrationId = window.localStorage.getItem(STORAGE_KEY);

          // Only include RegistrationId if it exists and this is not a retry
          if (!isRetry && RegistrationId && RegistrationId !== "undefined") {
            appendRegistrationId += `&RegistrationId=${RegistrationId}`;
            console.log("Using existing RegistrationId:", RegistrationId);
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
      }


  }, [CustomerId]);

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
