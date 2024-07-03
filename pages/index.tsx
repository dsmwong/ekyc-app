import { useState } from "react";
import { Box } from "@twilio-paste/core/box";
import { Heading } from "@twilio-paste/core/heading";
import { Button } from "@twilio-paste/button";
import { Label } from "@twilio-paste/label";
import { Input } from "@twilio-paste/input";
import { Text } from "@twilio-paste/text";
// import { HelpText } from "@twilio-paste/help-text";

import {
  Sidebar,
  SidebarHeader,
  SidebarHeaderLabel,
  SidebarHeaderIconButton,
  SidebarCollapseButton,
  SidebarBody,
  SidebarFooter,
  SidebarPushContentWrapper,
  SidebarNavigation,
  SidebarNavigationItem,
} from "@twilio-paste/core/sidebar";
import { useUID } from "@twilio-paste/core/uid-library";

import { LogoTwilioIcon } from "@twilio-paste/icons/cjs/LogoTwilioIcon";
import { ProductHomeIcon } from "@twilio-paste/icons/cjs/ProductHomeIcon";

import type { NextPage } from "next";
import Head from "next/head";

// This is dynamically loaded on the Client side - SSR disable
// import ComplianceEmbeddedWrapper from "../app/components/ComplianceEmbeddedWrapper";
import dynamic from "next/dynamic";
import { 
  Form, 
  FormActions, 
  FormControl, 
  RadioGroup,
  Radio
} from "@twilio-paste/core";
const DynamicComplianceEmbeddedWrapper = dynamic(
  () => import("../app/components/ComplianceEmbeddedWrapper"),
  { ssr: false }
);

const Home: NextPage = () => {
  const sidebarNavigationSkipLinkID = useUID();
  const topbarSkipLinkID = useUID();
  const mainContentSkipLinkID = useUID();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showComplianceFrame, setShowComplianceFrame] = useState(false);
  const [inquiryId, setInquiryId] = useState("");
  const [embeddableProduct, setEmbeddableProduct] = useState("");

  const [showTollFreeForm, setShowTollFreeForm] = useState(false);
  const [tollFreeNumber, setTollFreeNumber] = useState("+18777957145");

  const [inquiryEndPointURL, setInquiryEndPointURL] = useState(
    process.env.NEXT_PUBLIC_DEFAULT_URI
  );
  const [inquiryEndpointURLExample] = useState(
    "https://serverless-functions-xxxx-dev.twil.io/"
  );

  const toggleSidebarCollapsed = () => {
    return setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleComplianceFrame = () => {
    return setShowComplianceFrame(!showComplianceFrame);
  };

  return (
    <Box as="main" padding="space70">
      <Head>
        <title>Embedded Compliance for ISV Demo</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Sidebar
        sidebarNavigationSkipLinkID={sidebarNavigationSkipLinkID}
        topbarSkipLinkID={topbarSkipLinkID}
        mainContentSkipLinkID={mainContentSkipLinkID}
        collapsed={sidebarCollapsed}
        variant="compact"
      >
        <SidebarHeader>
          <SidebarHeaderIconButton as="a" href="#">
            <LogoTwilioIcon
              size="sizeIcon20"
              decorative={false}
              title="Go to Console homepage"
            />
          </SidebarHeaderIconButton>
          <SidebarHeaderLabel>Twilio Demo</SidebarHeaderLabel>
        </SidebarHeader>
        <SidebarBody>
          <SidebarNavigation aria-label="main" hierarchical hideItemsOnCollapse>
            <SidebarNavigationItem
              href="https://console.twilio.com"
              icon={<ProductHomeIcon decorative />}
            >
              Twilio Console
            </SidebarNavigationItem>
          </SidebarNavigation>
        </SidebarBody>
        <SidebarFooter>
          <SidebarCollapseButton
            i18nCollapseLabel="Close sidebar"
            i18nExpandLabel="Open sidebar"
            onClick={toggleSidebarCollapsed}
          />
        </SidebarFooter>
      </Sidebar>
      <SidebarPushContentWrapper collapsed={sidebarCollapsed} variant="compact">

        {/* <Button variant="primary" onClick={toggleSidebarCollapsed}>
          Toggle Push Sidebar
        </Button> */}

        <Box marginBottom="space30">
          <Form aria-labelledby={"compliance-starter-form"}>

        <Heading as="h1" variant="heading10" id="compliance-starter-form">
          Compliance Embedded App
        </Heading>

          <FormControl>
            <Label htmlFor="inquiry_ep_url" required>
              Inquiry Host Backend URL
            </Label>
            <Input
              type="text"
              id="inquiry_ep_url"
              name="inquiry_ep_url"
              placeholder={inquiryEndpointURLExample}
              value={inquiryEndPointURL}
              onChange={(e) => {
                setInquiryEndPointURL(e.target.value);
              }}
              required
            />

            <RadioGroup 
              name="embeddable_product" 
              value={embeddableProduct}
              legend="Select Embeddable Type" 
              orientation="horizontal"
              onChange={(value) => {
                console.log(value); 
                setEmbeddableProduct(value); 
                setShowComplianceFrame(false)
                setShowTollFreeForm(value === "tollFreeVerification" ? true : false)
              }}
              >
              <Radio id="customer_profile" value="customerProfile">
                Customer Profile
              </Radio>
              <Radio id="toll_free_verification" value="tollFreeVerification">
                Toll Free Verification
              </Radio>
              <Radio id="regulatory_bundle" value="regulatoryBundle" disabled>
                Regulatory Bundle (UK)
              </Radio>
              <Radio id="branded_calling" value="brandedCalling" name="Branded Calling" disabled>
                Branded Calling
              </Radio>

            </RadioGroup>
          </FormControl>

          { showTollFreeForm ? (
          <FormControl>
            <Label htmlFor="customer_id">
              Toll Free Number
            </Label>
            <Input
              type="text"
              id="toll_free_number"
              name="toll_free_number"
              placeholder="Toll Free Number"
              value={tollFreeNumber}
              onChange={(e) => {
                setTollFreeNumber(e.target.value);
              }}
              required
            />
          </FormControl>
          ) : (
            <div/>
          )}

          <FormControl>
            <Label htmlFor="inquiry_id">
              Inquiry ID
            </Label>
            <Text as="span">{inquiryId}</Text>
          </FormControl>
          <FormActions>
            <Button variant="primary" onClick={toggleComplianceFrame}>
              {showComplianceFrame ? "Hide" : "Show"} Compliance
            </Button>
          </FormActions>
        </Form>
        </Box>

        {/* This is dynamically loaded on the Client side - SSR disable */}
        {showComplianceFrame && inquiryEndPointURL ? (
          <DynamicComplianceEmbeddedWrapper
            inquiryEndPointURL={inquiryEndPointURL}
            embeddableProduct={embeddableProduct}
            tollFreeNumber={tollFreeNumber}
            onSetInquiryId={(id: string) => {
              setInquiryId(id);
            }}
          />
        ) : (
          <div />
        )}
      </SidebarPushContentWrapper>
    </Box>
  );
};

export default Home;
