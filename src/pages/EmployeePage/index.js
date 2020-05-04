// @flow
import React from "react";
import CredentialAPI from "api/credential";
import User from "entities/user";
import { Subscriber } from "@opentok/client";

import useStyles from "./styles";
import useSession from "hooks/session";
import useSubscriber from "hooks/subscriber";
import usePublisher from "hooks/publisher";
import useMessage from "hooks/message";

import BigName from "components/BigName";
import LiveBadge from "components/LiveBadge";
import VonageLogo from "components/VonageLogo"
import BlackLayer from "components/BlackLayer";
import WhiteLayer from "components/WhiteLayer";
import ChatList from "components/ChatList";
import ChatInput from "components/ChatInput";
import FullPageLoading from "components/FullPageLoading";
import AskNameDialog from "components/AskNameDialog";
import VideoControl from "components/VideoControl";
import RaiseHandButton from "components/RaiseHandButton";

function EmployeePage(){
  const [ me, setMe ] = React.useState(new User("Frans", "participant"));
  const [ presenter, setPresenter ] = React.useState<Subscriber|void>()
  const mSession = useSession();
  const mStyles = useStyles();
  const mSubscriber = useSubscriber();
  const mPublisher = usePublisher();
  const mMessage = useMessage();

  function handleNameSubmit(user:User){
    setMe(user);
  }

  async function connect(){
    if(me){
      const credential = await CredentialAPI.generateCredential("publisher", me.toJSON());
      await mSession.connect(credential);
    }
  }

  React.useEffect(() => {
    connect();
  }, [ me ]);

  React.useEffect(() => {
    if(mSession.session) mSubscriber.subscribe(mSession.streams);
  }, [ mSession.streams, mSession.session ]);

  React.useEffect(() => {
    if(mMessage.forceVideo){
      if(mMessage.forceVideo.user.id === mSession.session.connection.id){
        mPublisher.publisher.publishVideo(mMessage.forceVideo.hasVideo)
      } 
    }
  }, [ mMessage.forceVideo ]);

  React.useEffect(() => {
    if(mMessage.forceAudio){
      if(mMessage.forceAudio.user.id === mSession.session.connection.id){
        mPublisher.publisher.publishAudio(mMessage.forceAudio.hasAudio)
      } 
    }
  }, [ mMessage.forceAudio ]);

  React.useEffect(() => {
    if(mSession.session && mMessage.forcePublish){
      const { connection:localConnection } = mSession.session;
      const { user } = mMessage.forcePublish;
      if(localConnection.id === user.id && !mPublisher.publisher){
        mPublisher.publish("main", user);
      }
    }
  }, [ mSession.session, mMessage.forcePublish ]);

  React.useEffect(() => {
    if(mMessage.forceUnpublish){
      if(mMessage.forceUnpublish.user.id === mSession.session.connection.id){
        if(!mPublisher.publisher) throw new Error("No publisher found");
        mSession.session.unpublish(mPublisher.publisher)
      }
    }
  }, [ mMessage.forceUnpublish ])

  if(!me && !mSession.session) {
    return (
      <AskNameDialog 
        pin="1123"
        role="participant"
        onSubmit={handleNameSubmit}
      />
    )
  }
  else if(me && !mSession.session) return <FullPageLoading />
  else if(me && mSession.session) return (
    <div className={mStyles.container}>
      <div className={mStyles.leftContainer}>
        <div id="main" className={mStyles.videoContainer}/>
        <BlackLayer/>
        <WhiteLayer/>
        <BigName name={me.name} style={{ position: "absolute", top: 32, left: 32, zIndex: 2 }}/>
        <div className={mStyles.logoContainer}>
          <LiveBadge/>
          {!mPublisher.publisher? <RaiseHandButton />: (
            <VideoControl publisher={mPublisher.publisher} />
          )}
        </div>
        <VonageLogo style={{ position: "absolute", bottom: 32, right: 32, zIndex: 2 }}/>
      </div>
      <div className={mStyles.rightContainer}>
        <div className={mStyles.moderator}>
          <div id="moderator" className={mStyles.videoContainer}/>
        </div>
        <div className={mStyles.chatContainer}>
          <ChatList/>
          <ChatInput user={me} byPass={false}/>
        </div>
      </div>
    </div>
  )
}
export default EmployeePage;