'use client'

import * as React from 'react';
import { Spinner } from '@twilio-paste/core/spinner';
import { TwilioComplianceEmbed } from 'twilio-compliance-embed';

interface IComplianceInquiryData {
  inquiry_id: string;
  inquiry_session_token: string;
}

const ComplianceEmbeddedWrapper = ({inquiryEndPointURL} : {inquiryEndPointURL: string}) => {

  const [data, setData] = React.useState<IComplianceInquiryData | null>(null);
  const [isLoading, setLoading] = React.useState(true);

  React.useEffect(() => {

    const CustomerId = window.localStorage.getItem("CustomerId");
    let appendCustomerId = "";
    if (CustomerId && CustomerId !== "undefined") {
      appendCustomerId = `?CustomerProfileId=${CustomerId}`;
      console.log(appendCustomerId);
    }

    // need to make this configurable and passed into the component. 
    fetch(`${inquiryEndPointURL}initCustomerProfile${appendCustomerId}`, {
      method: "get",
    })
    .then((res) => res.json())
    .then((data) => {
      console.log("Customer Data");
      console.log(data);
      window.localStorage.setItem("CustomerId" , data.customer_id)
      setData(data);
      setLoading(false);
    })
    .catch((error) => {
      console.error("Error fetching customer data", error);
    })
  }, []);

  return !isLoading && (data?.inquiry_id) ? (
    
    <TwilioComplianceEmbed
      inquiryId={data.inquiry_id}
      inquirySessionToken={data.inquiry_session_token}
      onReady={() => {
        console.log("Ready!");
      }}
      onComplete={() => {
        console.log("Registration complete");
      }}
    />

  ) : (

    <Spinner decorative={false} title="Loading" />

  );
}

export default ComplianceEmbeddedWrapper;