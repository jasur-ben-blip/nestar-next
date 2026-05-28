import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Avatar, Box, Stack } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import MarkChatUnreadIcon from '@mui/icons-material/MarkChatUnread';
import { useRouter } from 'next/router';
import ScrollableFeed from 'react-scrollable-feed';
import { RippleBadge } from '../../scss/MaterialTheme/styled';
import { useReactiveVar } from '@apollo/client';
import { socketVar, userVar } from '../../apollo/store';
import { Member } from '../types/member/member';
import { sweetErrorAlert } from '../sweetAlert';

interface MessagePayload {
	event: string;
	text: string;
	memberData: Member;
}

interface InfoPayload {
	event: string;
	totalClients: number;
	memberData: Member;
	action: string;
}

const Chat = () => {
	const chatContentRef = useRef<HTMLDivElement>(null);
	const [messagesList, setMessagesList] = useState<MessagePayload[]>([]);
	const [onlineUsers, setOnlineUsers] = useState<number>(0);
	const textInput = useRef(null);
	const [message, setMessage] = useState<string>('');
	const [open, setOpen] = useState(false);
	const [openButton, setOpenButton] = useState(false);
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const socket = useReactiveVar(socketVar);

	/** LIFECYCLE: socket listener **/
	useEffect(() => {
		if (!socket) return;

		const handleSocketMessage = (msg: MessageEvent) => {
			const data = JSON.parse(msg.data);
			console.log('📩 WebSocket message received:', data);

			switch (data.event) {
				case 'info':
					const newInfo: InfoPayload = data;
					setOnlineUsers(newInfo.totalClients);
					break;
				case 'getMessage':
					const list: MessagePayload[] = data.list;
					setMessagesList(list);
					break;
				case 'message':
					const newMessage: MessagePayload = data;
					setMessagesList((prev) => [...prev, newMessage]);
					break;
				default:
					console.warn('❓ Unknown event:', data);
			}
		};

		socket.onmessage = handleSocketMessage;

		return () => {
			socket.onmessage = null;
		};
	}, [socket]);

	/** Toggle open/close chat icon **/
	useEffect(() => {
		const timeoutId = setTimeout(() => setOpenButton(true), 100);
		return () => clearTimeout(timeoutId);
	}, []);

	useEffect(() => {
		setOpenButton(false);
	}, [router.pathname]);

	/** Handlers **/
	const handleOpenChat = () => {
		setOpen((prev) => !prev);
	};

	const getInputMessageHandler = useCallback((e: any) => {
		setMessage(e.target.value);
	}, []);

	const getKeyHandler = (e: any) => {
		if (e.key === 'Enter') {
			onClickHandler();
		}
	};

	const onClickHandler = () => {
		if (!message) {
			sweetErrorAlert('Please type a message');
			return;
		}
		console.log('📤 Sending message:', message);
		socket.send(JSON.stringify({ event: 'message', data: message }));
		setMessage('');
	};

	/** Render **/
	return (
		<Stack className="chatting">
			{openButton && (
				<button className="chat-button" onClick={handleOpenChat}>
					{open ? <CloseFullscreenIcon /> : <MarkChatUnreadIcon />}
				</button>
			)}
			<Stack className={`chat-frame ${open ? 'open' : ''}`}>
				<Box className={'chat-top'} component="div">
					<div style={{ fontFamily: 'Nunito' }}>Online Chat</div>
					<RippleBadge style={{ margin: '-18px 0 0 21px' }} badgeContent={onlineUsers} />
				</Box>
				<Box className={'chat-content'} id="chat-content" ref={chatContentRef} component="div">
					<ScrollableFeed>
						<Stack className={'chat-main'}>
							<Box flexDirection="row" style={{ display: 'flex' }} sx={{ m: '10px 0px' }} component="div">
								<div className={'welcome'}>Welcome to Live chat!</div>
							</Box>

							{messagesList.map((ele: MessagePayload, idx) => {
								const { memberData, text } = ele;
								const memberImage = memberData?.memberImage || '/img/profile/defaultUser.svg';

								const isOwnMessage = memberData?._id === user?._id;

								return isOwnMessage ? (
									<Box
										key={idx}
										component="div"
										flexDirection="row"
										style={{ display: 'flex' }}
										alignItems="flex-end"
										justifyContent="flex-end"
										sx={{ m: '10px 0px' }}
									>
										<div className="msg-right">{text}</div>
									</Box>
								) : (
									<Box key={idx} flexDirection="row" style={{ display: 'flex' }} sx={{ m: '10px 0px' }} component="div">
										<Avatar alt="user" src={memberImage} />
										<div className="msg-left">{text}</div>
									</Box>
								);
							})}
						</Stack>
					</ScrollableFeed>
				</Box>
				<Box className="chat-bott" component="div">
					<input
						ref={textInput}
						type="text"
						name="message"
						value={message}
						className="msg-input"
						placeholder="Type message"
						onChange={getInputMessageHandler}
						onKeyDown={getKeyHandler}
					/>
					<button className="send-msg-btn" onClick={onClickHandler}>
						<SendIcon style={{ color: '#fff' }} />
					</button>
				</Box>
			</Stack>
		</Stack>
	);
};

export default Chat;
