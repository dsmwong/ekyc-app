'use client'

import * as React from 'react';
import { Spinner } from '@twilio-paste/core/spinner';
import { TwilioComplianceEmbed } from 'twilio-compliance-embed';

const ComplianceEmbeddedWrapper = () => {

  const [data, setData] = React.useState(null);
  const [isLoading, setLoading] = React.useState(true);

  React.useEffect(() => {

    const CustomerId = window.localStorage.getItem("CustomerId");
    let appendCustomerId = "";
    if (CustomerId && CustomerId !== "undefined") {
      appendCustomerId = `?CustomerProfileId=${CustomerId}`;
      console.log(appendCustomerId);
    }

    fetch(`https://serverless-functions-1228-dev.twil.io/initCustomerProfile${appendCustomerId}`, {
      method: "get",
    })
    .then((res) => res.json())
    .then((data) => {
      console.log("Customer Data");
      console.log(data);
      window.localStorage.setItem("CustomerId" , data.customer_id)
      setData(data);
      setLoading(false);
    });
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