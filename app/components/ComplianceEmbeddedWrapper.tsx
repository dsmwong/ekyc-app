"use client";

import * as React from "react";
import { Spinner } from "@twilio-paste/core/spinner";
import { Alert } from "@twilio-paste/core/alert";
import { TwilioComplianceEmbed } from "twilio-compliance-embed";

export interface ComplianceEmbeddedWrapperProps {
  inquiryEndPointURL: string;
  embeddableProduct: string;
  tollFreeNumber: string;
  rcPhoneNumberType: string;
  rcEndUserType: string;
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
  const RegistrationId = window.localStorage.getItem(LOCALSTORAGE_REGISTRATION_ID);

  React.useEffect(() => {

    console.log("Embeddable Product: ", props.embeddableProduct);

    // need to make this configurable and passed into the component.
    if( props.embeddableProduct == "customerProfile") {
  
      let appendCustomerId = "";
      if (CustomerId && CustomerId !== "undefined") {
        appendCustomerId = `?CustomerProfileId=${CustomerId}`;
        console.log(appendCustomerId);
      }
      
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
  
        let appendRegistrationId = "?";
        if (RegistrationId && RegistrationId !== "undefined") {
          appendRegistrationId += `RegistrationId=${RegistrationId}`;
          console.log(appendRegistrationId);
        }
        appendRegistrationId += `&PhoneNumberType=${props.rcPhoneNumberType}`;
        appendRegistrationId += `&EndUserType=${props.rcEndUserType}`;
        appendRegistrationId += `&FriendlyName=GB%20Bundle%20-%20${props.rcPhoneNumberType}%20${props.rcEndUserType}`;
        
        console.log(appendRegistrationId);
        
        fetch(`${props.inquiryEndPointURL}initRegulatoryBundle${appendRegistrationId}`, {
          method: "get",
        })
          .then((res) => res.json())
          .then((data) => {
            console.log("Registration Data");
            console.log(data);
            window.localStorage.setItem(LOCALSTORAGE_REGISTRATION_ID, data.registration_id);
  
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
        } else if( props.embeddableProduct == "tollFreeVerification") {

        fetch(`${props.inquiryEndPointURL}initTollFreeVerification?TollfreePhoneNumber=${props.tollFreeNumber}`, {
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
