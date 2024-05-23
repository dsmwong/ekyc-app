import { useState } from "react";
import { Box } from "@twilio-paste/core/box";
import { Heading } from "@twilio-paste/core/heading";
import { Button } from "@twilio-paste/button";
import { Label } from "@twilio-paste/label";
import { Input } from "@twilio-paste/input";
import { HelpText } from "@twilio-paste/help-text";


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
  SidebarNavigationItem
} from '@twilio-paste/core/sidebar';
import { useUID } from "@twilio-paste/core/uid-library";

import { LogoTwilioIcon } from "@twilio-paste/icons/cjs/LogoTwilioIcon";
import { ProductHomeIcon } from "@twilio-paste/icons/cjs/ProductHomeIcon";

import type { NextPage } from "next";
import Head from "next/head";

import ComplianceEmbeddedWrapper from "../app/components/ComplianceEmbeddedWrapper";

const Home: NextPage = () => {

  const sidebarNavigationSkipLinkID = useUID();
  const topbarSkipLinkID = useUID();
  const mainContentSkipLinkID = useUID();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebarCollapsed = () => {
    return setSidebarCollapsed(!sidebarCollapsed);
  }
  
  return (
    <Box as="main" padding="space70">
      <Head>
        <title>Paste NextJS App</title>
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
            <LogoTwilioIcon size="sizeIcon20" decorative={false} title="Go to Console homepage" />
          </SidebarHeaderIconButton>
          <SidebarHeaderLabel>Twilio Demo</SidebarHeaderLabel>
        </SidebarHeader>
        <SidebarBody>
        <SidebarNavigation aria-label="main" hierarchical hideItemsOnCollapse>
          <SidebarNavigationItem href="https://console.twilio.com" icon={<ProductHomeIcon decorative />}>
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

        <Heading as="h1" variant="heading10">
          Welcome to Demo Template
        </Heading>

        <Button variant="primary" mainContentSkipLinkID={mainContentSkipLinkID} onClick={toggleSidebarCollapsed}>
          Toggle Push Sidebar
        </Button>

        <Label htmlFor="inquiry_id" required>Inquiry ID</Label>
        <Input type="text" aria-describedby="inquiry_id_help_text" id="inquiry_id" name="inquiry_id" placeholder="xxxx" onChange={()=>{}} required/>
        <HelpText id="inquiry_id_help_text">Inquiry ID from Server Sid Request</HelpText>

        <Label htmlFor="session_token" required>Inquiry Session Token</Label>
        <Input type="text" aria-describedby="session_token_help_text" id="session_token" name="session_token" placeholder="xxxx" onChange={()=>{}} required/>
        <HelpText id="session_token_help_text">Session Token from Server Sid Request</HelpText>

        <ComplianceEmbeddedWrapper/>

        {/* <MyComplianceInquiry/> */}

        {/* <TwilioComplianceEmbed
          inquiryId="inq_8sEafLYwq2Yq6e9Yao2anY94T4Ec"
          inquirySessionToken="eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJpcXNlX0t6MWQzVlJXMnl6dER2WkYzM3V3VVk5OFJDSGsiLCJhdWQiOiJwZXJzb25hLXZlcmlmeSIsImlzcyI6IndpdGhwZXJzb25hLmNvbSIsImlhdCI6MTcxNjQ0MzQ3MSwibmJmIjoxNzE2NDQzNDcxLCJleHAiOjE3MTY1Mjk4NzAsImp0aSI6ImVkNDVlYzJjLTc2Y2YtNDg4Zi1hOGMwLTk3OTQzNGNjYTA0NyIsImlucXVpcnlfaWQiOiJpbnFfOHNFYWZMWXdxMllxNmU5WWFvMmFuWTk0VDRFYyIsImVudmlyb25tZW50X2lkIjoiZW52X0xucEd4Zk1BV3Z3NnoxNGJMMXN3WGdhdCJ9.4LzYJOuy3Uj7zY8Z1CbDfxa2-Us-vXiv6ZFaK1NMns8"
          onReady={() => {
            console.log("Ready!");
          }}
          onComplete={() => {
            console.log("Registration complete");
          }}
        /> */}

      </SidebarPushContentWrapper>


    </Box>
  );
};

export default Home;
