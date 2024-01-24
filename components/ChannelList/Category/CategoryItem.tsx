import Link from 'next/link';
import { Channel } from 'stream-chat';
import { DefaultStreamChatGenerics } from 'stream-chat-react/dist/types/types';
import CustomChannelPreview from '../CustomChannelPreview';
import { useState } from 'react';
import { ChevronRight, PlusIcon } from '../Icons';

import './CategoryItem.css';

type CategoryItemProps = {
  category: string;
  serverName: string;
  channels: Channel<DefaultStreamChatGenerics>[];
};

export default function CategoryItem({
  category,
  serverName,
  channels,
}: CategoryItemProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <>
      <div className='flex items-center text-gray-500 mb-2 p-2'>
        <button
          className='flex w-full items-center justify-start'
          onClick={() => setIsOpen((currentValue) => !currentValue)}
        >
          <div
            className={`${
              isOpen ? 'rotate-90' : ''
            } transition-all ease-in-out duration-200`}
          >
            <ChevronRight size={4} />
          </div>
          <span className='inline-block uppercase text-sm font-bold  px-2'>
            {category}
          </span>
        </button>
        <Link
          className='inline-block create-button'
          href={`/?createChannel=true&serverName=${serverName}&category=${category}`}
        >
          <PlusIcon size={4} />
        </Link>
      </div>
      {isOpen && (
        <div>
          {channels.map((channel) => {
            return (
              <CustomChannelPreview
                key={channel.id}
                channel={channel}
                className='w-full'
              />
            );
          })}
        </div>
      )}
    </>
  );
}
