"use client";

import * as React from "react";
import { Spinner } from "@twilio-paste/core/spinner";
import { Alert } from "@twilio-paste/core/alert";
import { TwilioComplianceEmbed } from "twilio-compliance-embed";

export interface ComplianceEmbeddedWrapperProps {
  inquiryEndPointURL: string;
  setReturnedInquiryId: (id: string) => void;
}

const ComplianceEmbeddedWrapper = (props: ComplianceEmbeddedWrapperProps ) => {
  // const [data, setData] = React.useState<IComplianceInquiryData>();
  const [isLoading, setLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string>("");
  const [inquiryId, setInquiryId] = React.useState<string>("");
  const [inquirySessionToken, setInquirySessionToken] =
    React.useState<string>("");

  const CustomerId = window.localStorage.getItem("CustomerId");

  React.useEffect(() => {
    let appendCustomerId = "";
    if (CustomerId && CustomerId !== "undefined") {
      appendCustomerId = `?CustomerProfileId=${CustomerId}`;
      console.log(appendCustomerId);
    }

    // need to make this configurable and passed into the component.
    fetch(`${props.inquiryEndPointURL}initCustomerProfile${appendCustomerId}`, {
      method: "get",
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Customer Data");
        console.log(data);
        window.localStorage.setItem("CustomerId", data.customer_id);

        if (
          (data && data.hasOwnProperty("inquery_id")) ||
          data.hasOwnProperty("inquiry_session_token")
        ) {
          setInquiryId(data.inquiry_id);          
          setInquirySessionToken(data.inquiry_session_token);
          props.setReturnedInquiryId(data.inquiry_id);
        } else {
          setErrorMessage("Backend not so nice, missing required data");
        }
      })
      .catch((error) => {
        console.error("Error fetching customer data", error);
        setErrorMessage(`Error fetching customer data - ${error.message}`);
      })
      .finally(() => setLoading(false));
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
